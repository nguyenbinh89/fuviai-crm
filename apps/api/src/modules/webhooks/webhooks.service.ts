import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookEvent, WebhookDeliveryStatus } from '@prisma/client';
import { WEBHOOK_QUEUE, type DeliverWebhookJob } from '../queues/webhook-queue.processor';

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: WebhookEvent[];
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateWebhookDto) {
    const secret = randomBytes(32).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: {
        organizationId,
        createdById: userId,
        name:   dto.name,
        url:    dto.url,
        secret,
        events: dto.events,
      },
      select: {
        id: true, name: true, url: true, events: true,
        isActive: true, secret: true, createdAt: true,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, url: true, events: true,
        isActive: true, lastTriggeredAt: true, failureCount: true, createdAt: true,
      },
    });
  }

  async update(id: string, organizationId: string, dto: Partial<CreateWebhookDto> & { isActive?: boolean }) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, organizationId } });
    if (!endpoint) throw new NotFoundException('Webhook không tồn tại');

    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(dto.name    !== undefined && { name: dto.name }),
        ...(dto.url     !== undefined && { url: dto.url }),
        ...(dto.events  !== undefined && { events: dto.events }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true, name: true, url: true, events: true,
        isActive: true, createdAt: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, organizationId } });
    if (!endpoint) throw new NotFoundException('Webhook không tồn tại');
    await this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async findDeliveries(endpointId: string, organizationId: string, limit = 50) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id: endpointId, organizationId } });
    if (!endpoint) throw new NotFoundException('Webhook không tồn tại');

    return this.prisma.webhookDelivery.findMany({
      where: { endpointId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Gửi event đến tất cả webhook endpoints đang active của org.
   * Tạo delivery record ngay, sau đó enqueue job vào BullMQ (có retry 5 lần).
   */
  async trigger(organizationId: string, event: WebhookEvent, payload: Record<string, unknown>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { organizationId, isActive: true, events: { has: event } },
    });

    for (const endpoint of endpoints) {
      // Pre-create delivery record để có ID ngay
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          organizationId,
          endpointId: endpoint.id,
          event,
          payload: payload as any,
          status: WebhookDeliveryStatus.PENDING,
        },
      });

      const jobData: DeliverWebhookJob = {
        endpointId:           endpoint.id,
        endpointUrl:          endpoint.url,
        endpointSecret:       endpoint.secret,
        endpointFailureCount: endpoint.failureCount,
        event,
        payload,
        organizationId,
        deliveryId: delivery.id,
      };

      // Enqueue — BullMQ retry với exponential backoff
      await this.webhookQueue.add('deliver', jobData, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 10_000 }, // 10s, 20s, 40s, 80s, 160s
        removeOnComplete: { age: 86_400 },
        removeOnFail:     { age: 7 * 86_400 },
      });
    }
  }
}
