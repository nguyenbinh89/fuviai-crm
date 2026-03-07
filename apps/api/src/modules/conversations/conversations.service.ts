import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationsRepository } from './conversations.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
import { ConversationChannel } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly repo: ConversationsRepository) {}

  // =====================
  // CONVERSATIONS
  // =====================

  async create(organizationId: string, dto: CreateConversationDto, userId: string) {
    return this.repo.create(organizationId, dto, userId);
  }

  async findAll(
    organizationId: string,
    opts: {
      channel?: ConversationChannel;
      isOpen?: boolean;
      contactId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { items, total } = await this.repo.findAll(organizationId, opts);
    return { items, total, page: opts.page ?? 1, limit: opts.limit ?? 30 };
  }

  async findById(id: string, organizationId: string) {
    const conv = await this.repo.findById(id, organizationId);
    if (!conv) throw new NotFoundException(`Không tìm thấy cuộc trò chuyện: ${id}`);
    // Reset unread khi mở conversation
    await this.repo.resetUnread(id);
    return conv;
  }

  async close(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repo.closeConversation(id, organizationId);
  }

  async reopen(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repo.reopenConversation(id);
  }

  async assign(id: string, organizationId: string, assignedToId: string) {
    await this.findById(id, organizationId);
    return this.repo.assignConversation(id, assignedToId);
  }

  // =====================
  // MESSAGES
  // =====================

  async sendMessage(id: string, organizationId: string, dto: SendMessageDto, userId: string) {
    await this.findById(id, organizationId);

    // TODO Sprint 7: Gọi Zalo OA API gửi tin thật sự
    // const conv = await this.repo.findById(id, organizationId);
    // if (conv.channel === 'ZALO' && conv.zaloUserId) {
    //   await this.zaloService.sendText(conv.zaloUserId, dto.content);
    // }

    return this.repo.sendMessage(id, organizationId, dto, userId);
  }

  // =====================
  // ZALO WEBHOOK
  // =====================

  async handleZaloWebhook(payload: ZaloWebhookDto, organizationId: string) {
    // Chỉ xử lý event user gửi tin nhắn đến OA
    if (payload.event_name !== 'user_send_text' && payload.event_name !== 'user_send_image') {
      return { received: true, processed: false, reason: 'Bỏ qua event không phải tin nhắn' };
    }

    const zaloUserId = payload.sender?.id;
    const zaloOaId = payload.recipient?.id ?? '';
    const messageText = payload.message?.text ?? '';
    const msgId = payload.message?.msg_id;
    const attachmentUrl = payload.message?.attachments?.[0]?.payload?.url;
    const messageType = payload.event_name === 'user_send_image' ? 'image' : 'text';

    if (!zaloUserId || !messageText) {
      return { received: true, processed: false, reason: 'Thiếu sender hoặc nội dung' };
    }

    // Tìm hoặc tạo conversation
    const conversation = await this.repo.findOrCreateZaloConversation(
      organizationId,
      zaloUserId,
      zaloOaId,
    );

    // Lưu tin nhắn inbound
    await this.repo.receiveInboundMessage(
      organizationId,
      conversation.id,
      messageText,
      msgId,
      messageType,
      attachmentUrl,
    );

    return { received: true, processed: true, conversationId: conversation.id };
  }

  async getStats(organizationId: string) {
    return this.repo.getStats(organizationId);
  }
}
