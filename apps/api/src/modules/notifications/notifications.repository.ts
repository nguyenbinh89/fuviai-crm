import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: (input.metadata ?? {}) as any,
      },
    });
  }

  async findMany(organizationId: string, userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { organizationId, userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { organizationId, userId } }),
    ]);
    return { notifications, total };
  }

  async countUnread(organizationId: string, userId: string) {
    return this.prisma.notification.count({
      where: { organizationId, userId, isRead: false },
    });
  }

  async markRead(id: string, organizationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, organizationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(organizationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { organizationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteOld(organizationId: string, keepDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);
    return this.prisma.notification.deleteMany({
      where: { organizationId, createdAt: { lt: cutoff } },
    });
  }
}
