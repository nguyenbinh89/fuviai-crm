import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageDirection, MessageStatus, ConversationChannel, Prisma } from '@prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

// Include mặc định cho Conversation list
const CONVERSATION_LIST_INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ConversationInclude;

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // CONVERSATIONS
  // =====================

  async create(organizationId: string, dto: CreateConversationDto, userId: string) {
    const conversation = await this.prisma.conversation.create({
      data: {
        organizationId,
        contactId: dto.contactId,
        channel: dto.channel,
        zaloUserId: dto.zaloUserId,
        zaloOaId: dto.zaloOaId,
        assignedToId: userId,
        lastMessageAt: new Date(),
      },
      include: CONVERSATION_LIST_INCLUDE,
    });

    // Tạo tin nhắn mở đầu nếu có
    if (dto.initialMessage) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          organizationId,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.SENT,
          content: dto.initialMessage,
          senderId: userId,
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessagePreview: dto.initialMessage },
      });
    }

    return conversation;
  }

  async findAll(
    organizationId: string,
    opts: {
      channel?: ConversationChannel;
      isOpen?: boolean;
      contactId?: string;
      assignedToId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { channel, isOpen, contactId, assignedToId, page = 1, limit = 30 } = opts;

    const where: Prisma.ConversationWhereInput = { organizationId, deletedAt: null };
    if (channel) where.channel = channel;
    if (isOpen !== undefined) where.isOpen = isOpen;
    if (contactId) where.contactId = contactId;
    if (assignedToId) where.assignedToId = assignedToId;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: CONVERSATION_LIST_INCLUDE,
        orderBy: [{ isOpen: 'desc' }, { lastMessageAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.conversation.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        ...CONVERSATION_LIST_INCLUDE,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async closeConversation(id: string, organizationId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { isOpen: false, unreadCount: 0 },
      include: CONVERSATION_LIST_INCLUDE,
    });
  }

  async reopenConversation(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { isOpen: true },
      include: CONVERSATION_LIST_INCLUDE,
    });
  }

  async assignConversation(id: string, assignedToId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { assignedToId },
      include: CONVERSATION_LIST_INCLUDE,
    });
  }

  async resetUnread(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
      select: { id: true },
    });
  }

  // =====================
  // MESSAGES
  // =====================

  async sendMessage(
    conversationId: string,
    organizationId: string,
    dto: SendMessageDto,
    userId: string,
  ) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          organizationId,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.SENT,
          content: dto.content,
          messageType: dto.messageType ?? 'text',
          attachmentUrl: dto.attachmentUrl,
          senderId: userId,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: dto.content.slice(0, 100),
          isOpen: true,
        },
      }),
    ]);
    return message;
  }

  // Nhận tin nhắn từ Zalo webhook
  async receiveInboundMessage(
    organizationId: string,
    conversationId: string,
    content: string,
    externalId?: string,
    messageType = 'text',
    attachmentUrl?: string,
  ) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          organizationId,
          direction: MessageDirection.INBOUND,
          status: MessageStatus.DELIVERED,
          content,
          messageType,
          attachmentUrl,
          externalId,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.slice(0, 100),
          isOpen: true,
          unreadCount: { increment: 1 },
        },
      }),
    ]);
    return message;
  }

  // Tìm hoặc tạo conversation theo zaloUserId
  async findOrCreateZaloConversation(
    organizationId: string,
    zaloUserId: string,
    zaloOaId: string,
  ) {
    // Tìm conversation đã tồn tại
    const existing = await this.prisma.conversation.findFirst({
      where: {
        organizationId,
        channel: ConversationChannel.ZALO,
        zaloUserId,
        deletedAt: null,
      },
    });
    if (existing) return existing;

    // Tìm contact theo zaloUserId (có thể lưu trong customFields)
    // Nếu không tìm thấy, tạo contact mới
    const contact = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        customFields: { path: ['zaloUserId'], equals: zaloUserId },
      },
    }) ?? await this.prisma.contact.create({
      data: {
        organizationId,
        firstName: `Zalo User`,
        lastName: zaloUserId.slice(-6),
        customFields: { zaloUserId },
        createdById: null,
        updatedById: null,
      },
    });

    return this.prisma.conversation.create({
      data: {
        organizationId,
        contactId: contact.id,
        channel: ConversationChannel.ZALO,
        zaloUserId,
        zaloOaId,
        lastMessageAt: new Date(),
      },
    });
  }

  // Stats
  async getStats(organizationId: string) {
    const [total, unread, open] = await Promise.all([
      this.prisma.conversation.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.conversation.count({ where: { organizationId, deletedAt: null, unreadCount: { gt: 0 } } }),
      this.prisma.conversation.count({ where: { organizationId, deletedAt: null, isOpen: true } }),
    ]);
    return { total, unread, open };
  }
}
