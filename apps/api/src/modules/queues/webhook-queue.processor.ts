import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookEvent, WebhookDeliveryStatus } from '@prisma/client';

export const WEBHOOK_QUEUE = 'webhook';

export interface DeliverWebhookJob {
  endpointId: string;
  endpointUrl: string;
  endpointSecret: string;
  endpointFailureCount: number;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  organizationId: string;
  deliveryId: string; // pre-created delivery record
}

/**
 * Processor xử lý delivery webhook async qua BullMQ.
 * Hỗ trợ retry 5 lần với exponential backoff.
 * Thay thế deliverOne() inline trong WebhooksService.
 */
@Processor(WEBHOOK_QUEUE)
export class WebhookQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<DeliverWebhookJob>): Promise<void> {
    const {
      endpointId, endpointUrl, endpointSecret, endpointFailureCount,
      event, payload, organizationId, deliveryId,
    } = job.data;

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = createHmac('sha256', endpointSecret).update(body).digest('hex');

    // Cập nhật status thành RETRYING nếu là lần thử lại
    if (job.attemptsMade > 0) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: WebhookDeliveryStatus.RETRYING },
      });
    }

    const start = Date.now();
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FuviAI-Signature': `sha256=${signature}`,
          'X-FuviAI-Event': event,
          'X-FuviAI-Delivery': deliveryId,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      const durationMs   = Date.now() - start;
      const responseBody = await res.text().catch(() => '');
      const success      = res.status >= 200 && res.status < 300;

      if (!success) {
        // Ném lỗi để BullMQ thực hiện retry
        throw new Error(`HTTP ${res.status}: ${responseBody.slice(0, 200)}`);
      }

      await this.prisma.$transaction([
        this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: WebhookDeliveryStatus.SUCCESS,
            responseCode: res.status,
            responseBody: responseBody.slice(0, 500),
            durationMs,
          },
        }),
        this.prisma.webhookEndpoint.update({
          where: { id: endpointId },
          data: { lastTriggeredAt: new Date(), failureCount: 0 },
        }),
      ]);

      this.logger.log(`Webhook ${endpointId} → ${event}: SUCCESS (${res.status}, ${durationMs}ms)`);
    } catch (err) {
      const durationMs = Date.now() - start;
      const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;
      const newFailureCount = endpointFailureCount + 1;

      if (isLastAttempt) {
        // Đã hết lần retry — đánh dấu FAILED + auto-disable nếu ≥ 10 thất bại
        await this.prisma.$transaction([
          this.prisma.webhookDelivery.update({
            where: { id: deliveryId },
            data: {
              status: WebhookDeliveryStatus.FAILED,
              durationMs,
            },
          }),
          this.prisma.webhookEndpoint.update({
            where: { id: endpointId },
            data: {
              failureCount: newFailureCount,
              ...(newFailureCount >= 10 && { isActive: false }),
            },
          }),
        ]);
        this.logger.warn(`Webhook ${endpointId} → ${event}: FAILED sau ${job.attemptsMade + 1} lần thử`);
      }

      throw err; // để BullMQ retry
    }
  }
}
