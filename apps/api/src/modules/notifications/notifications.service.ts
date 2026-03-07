import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository, CreateNotificationInput } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Tạo notification và push real-time đến user qua WebSocket.
   * Dùng bởi các service khác (deals, activities, conversations...).
   */
  async create(input: CreateNotificationInput) {
    const notification = await this.repo.create(input);
    // Push real-time
    this.gateway.sendToUser(input.userId, notification);
    return notification;
  }

  async findMany(organizationId: string, userId: string, page: number, limit: number) {
    return this.repo.findMany(organizationId, userId, page, limit);
  }

  async countUnread(organizationId: string, userId: string) {
    return this.repo.countUnread(organizationId, userId);
  }

  async markRead(id: string, organizationId: string, userId: string) {
    await this.repo.markRead(id, organizationId, userId);
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.repo.markAllRead(organizationId, userId);
  }

  // ---- Helpers: gọi từ các module khác ----

  async notifyDealWon(
    organizationId: string,
    userId: string,
    dealTitle: string,
    dealId: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.DEAL_WON,
      title: '🎉 Deal thắng!',
      body: `Deal "${dealTitle}" đã được đánh dấu Won.`,
      metadata: { dealId },
    });
  }

  async notifyDealLost(
    organizationId: string,
    userId: string,
    dealTitle: string,
    dealId: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.DEAL_LOST,
      title: '😞 Deal thua',
      body: `Deal "${dealTitle}" đã được đánh dấu Lost.`,
      metadata: { dealId },
    });
  }

  async notifyNewMessage(
    organizationId: string,
    userId: string,
    contactName: string,
    conversationId: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.NEW_MESSAGE,
      title: '💬 Tin nhắn mới',
      body: `${contactName} vừa gửi tin nhắn.`,
      metadata: { conversationId },
    });
  }

  async notifyActivityAssigned(
    organizationId: string,
    userId: string,
    subject: string,
    activityId: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.ACTIVITY_ASSIGNED,
      title: '📋 Được giao việc',
      body: `Bạn được giao: "${subject}".`,
      metadata: { activityId },
    });
  }

  async notifyWorkflowFailed(
    organizationId: string,
    userId: string,
    workflowName: string,
    workflowId: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.WORKFLOW_FAILED,
      title: '⚠️ Workflow lỗi',
      body: `Workflow "${workflowName}" thực thi thất bại.`,
      metadata: { workflowId },
    });
  }

  async notifyTeamMemberJoined(
    organizationId: string,
    notifyUserId: string,
    newMemberName: string,
  ) {
    return this.create({
      organizationId,
      userId: notifyUserId,
      type: NotificationType.TEAM_MEMBER_JOINED,
      title: '👋 Thành viên mới',
      body: `${newMemberName} vừa tham gia tổ chức.`,
      metadata: {},
    });
  }

  async notifyBillingAlert(
    organizationId: string,
    userId: string,
    message: string,
  ) {
    return this.create({
      organizationId,
      userId,
      type: NotificationType.BILLING_ALERT,
      title: '💳 Cảnh báo Billing',
      body: message,
      metadata: {},
    });
  }
}
