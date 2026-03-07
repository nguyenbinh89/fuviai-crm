import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignStatus, RecipientStatus, Prisma } from '@prisma/client';

export const EMAIL_QUEUE = 'email';

export interface SendCampaignJob {
  campaignId: string;
  organizationId: string;
  userId: string;
}

/**
 * Processor xử lý các job gửi email campaign async qua BullMQ.
 * Thay thế việc gửi sync trong EmailMarketingRepository.
 */
@Processor(EMAIL_QUEUE)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<SendCampaignJob>): Promise<void> {
    const { campaignId, organizationId, userId } = job.data;

    this.logger.log(`Xử lý job gửi campaign ${campaignId} (attempt ${job.attemptsMade + 1})`);

    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id: campaignId, organizationId, deletedAt: null },
    });
    if (!campaign) {
      this.logger.warn(`Campaign ${campaignId} không tồn tại — bỏ qua`);
      return;
    }

    // Lấy danh sách contacts theo filter
    const contactWhere: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      email: { not: null },
    };
    if (campaign.filterStatus) contactWhere.status = campaign.filterStatus;
    if (campaign.filterTagId) {
      contactWhere.tags = { some: { tagId: campaign.filterTagId } };
    }

    const contacts = await this.prisma.contact.findMany({
      where: contactWhere,
      select: { id: true, email: true },
    });

    // Tạo recipient records
    await this.prisma.emailCampaignRecipient.createMany({
      data: contacts.map((c) => ({
        campaignId,
        contactId: c.id,
        email: c.email!,
        status: RecipientStatus.PENDING,
      })),
      skipDuplicates: true,
    });

    // TODO: Tích hợp AWS SES / SendGrid để gửi thực tế
    // Hiện tại: simulate bằng cách mark SENT ngay
    await this.prisma.emailCampaignRecipient.updateMany({
      where: { campaignId, status: RecipientStatus.PENDING },
      data: { status: RecipientStatus.SENT, sentAt: new Date() },
    });

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
        sentAt: new Date(),
        totalRecipients: contacts.length,
        totalSent: contacts.length,
        updatedById: userId,
      },
    });

    this.logger.log(`Campaign ${campaignId} đã gửi xong: ${contacts.length} recipients`);
  }
}
