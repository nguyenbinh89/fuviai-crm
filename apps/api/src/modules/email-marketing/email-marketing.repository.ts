import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignStatus, RecipientStatus, Prisma } from '@prisma/client';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class EmailMarketingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // TEMPLATES
  // =====================

  async createTemplate(organizationId: string, dto: CreateTemplateDto, userId: string) {
    // Nếu set isDefault, bỏ default của các template khác
    if (dto.isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { organizationId, deletedAt: null },
        data: { isDefault: false },
      });
    }
    return this.prisma.emailTemplate.create({
      data: {
        organizationId,
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        previewText: dto.previewText,
        isDefault: dto.isDefault ?? false,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  async findAllTemplates(organizationId: string) {
    return this.prisma.emailTemplate.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findTemplateById(id: string, organizationId: string) {
    return this.prisma.emailTemplate.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  async updateTemplate(id: string, organizationId: string, dto: Partial<CreateTemplateDto>, userId: string) {
    if (dto.isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { organizationId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.emailTemplate.update({
      where: { id },
      data: { ...dto, updatedById: userId },
    });
  }

  async softDeleteTemplate(id: string) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  // =====================
  // CAMPAIGNS
  // =====================

  async createCampaign(organizationId: string, dto: CreateCampaignDto, userId: string) {
    return this.prisma.emailCampaign.create({
      data: {
        organizationId,
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        previewText: dto.previewText,
        templateId: dto.templateId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        filterStatus: dto.filterStatus,
        filterTagId: dto.filterTagId,
        createdById: userId,
        updatedById: userId,
      },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async findAllCampaigns(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.EmailCampaignWhereInput = { organizationId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.emailCampaign.findMany({
        where,
        include: { template: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailCampaign.count({ where }),
    ]);

    return { items, total };
  }

  async findCampaignById(id: string, organizationId: string) {
    return this.prisma.emailCampaign.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        template: { select: { id: true, name: true } },
        recipients: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { contact: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  async updateCampaign(id: string, dto: Partial<CreateCampaignDto>, userId: string) {
    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        updatedById: userId,
      },
      include: { template: { select: { id: true, name: true } } },
    });
  }

  async softDeleteCampaign(id: string) {
    return this.prisma.emailCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  // =====================
  // SEND CAMPAIGN
  // =====================

  async markCampaignSending(campaignId: string, userId: string) {
    return this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.SENDING, updatedById: userId },
      select: { id: true, status: true },
    });
  }

  async sendCampaign(campaignId: string, organizationId: string, userId: string) {
    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id: campaignId, organizationId, deletedAt: null },
    });
    if (!campaign) return null;

    // Lấy danh sách contacts theo filter
    const contactWhere: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      email: { not: null }, // Chỉ gửi cho contacts có email
    };
    if (campaign.filterStatus) contactWhere.status = campaign.filterStatus;
    if (campaign.filterTagId) {
      contactWhere.tags = { some: { tagId: campaign.filterTagId } };
    }

    const contacts = await this.prisma.contact.findMany({
      where: contactWhere,
      select: { id: true, email: true },
    });

    if (contacts.length === 0) {
      // Không có recipient nào — đánh dấu sent với 0 recipients
      return this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.SENT,
          sentAt: new Date(),
          totalRecipients: 0,
          updatedById: userId,
        },
      });
    }

    // Tạo recipient records (upsert để tránh duplicate nếu gửi lại)
    await this.prisma.emailCampaignRecipient.createMany({
      data: contacts.map((c) => ({
        campaignId,
        contactId: c.id,
        email: c.email!,
        status: RecipientStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    // Trong thực tế sẽ đẩy vào BullMQ queue để gửi async qua AWS SES
    // Ở đây simulate: mark tất cả là SENT ngay
    await this.prisma.emailCampaignRecipient.updateMany({
      where: { campaignId, status: RecipientStatus.PENDING },
      data: { status: RecipientStatus.SENT, sentAt: new Date() },
    });

    // Cập nhật stats
    return this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
        sentAt: new Date(),
        totalRecipients: contacts.length,
        totalSent: contacts.length,
        updatedById: userId,
      },
    });
  }

  // Stats tổng quan
  async getCampaignStats(organizationId: string) {
    const [total, byStatus] = await Promise.all([
      this.prisma.emailCampaign.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.emailCampaign.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: true,
        _sum: { totalSent: true, totalOpened: true, totalRecipients: true },
      }),
    ]);

    return { total, byStatus };
  }
}
