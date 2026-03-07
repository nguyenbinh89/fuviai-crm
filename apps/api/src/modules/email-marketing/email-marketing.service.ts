import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailMarketingRepository } from './email-marketing.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { EMAIL_QUEUE, type SendCampaignJob } from '../queues/email-queue.processor';

@Injectable()
export class EmailMarketingService {
  constructor(
    private readonly repo: EmailMarketingRepository,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
  ) {}

  // =====================
  // TEMPLATES
  // =====================

  async createTemplate(organizationId: string, dto: CreateTemplateDto, userId: string) {
    return this.repo.createTemplate(organizationId, dto, userId);
  }

  async findAllTemplates(organizationId: string) {
    return this.repo.findAllTemplates(organizationId);
  }

  async findTemplateById(id: string, organizationId: string) {
    const template = await this.repo.findTemplateById(id, organizationId);
    if (!template) throw new NotFoundException(`Không tìm thấy template: ${id}`);
    return template;
  }

  async updateTemplate(id: string, organizationId: string, dto: Partial<CreateTemplateDto>, userId: string) {
    await this.findTemplateById(id, organizationId);
    return this.repo.updateTemplate(id, organizationId, dto, userId);
  }

  async deleteTemplate(id: string, organizationId: string) {
    await this.findTemplateById(id, organizationId);
    return this.repo.softDeleteTemplate(id);
  }

  // =====================
  // CAMPAIGNS
  // =====================

  async createCampaign(organizationId: string, dto: CreateCampaignDto, userId: string) {
    return this.repo.createCampaign(organizationId, dto, userId);
  }

  async findAllCampaigns(organizationId: string, page = 1, limit = 20) {
    const { items, total } = await this.repo.findAllCampaigns(organizationId, page, limit);
    return { items, total, page, limit };
  }

  async findCampaignById(id: string, organizationId: string) {
    const campaign = await this.repo.findCampaignById(id, organizationId);
    if (!campaign) throw new NotFoundException(`Không tìm thấy chiến dịch: ${id}`);
    return campaign;
  }

  async updateCampaign(id: string, organizationId: string, dto: Partial<CreateCampaignDto>, userId: string) {
    const campaign = await this.findCampaignById(id, organizationId);
    // Chỉ được edit khi DRAFT
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể chỉnh sửa chiến dịch đang ở trạng thái DRAFT');
    }
    return this.repo.updateCampaign(id, dto, userId);
  }

  async deleteCampaign(id: string, organizationId: string) {
    await this.findCampaignById(id, organizationId);
    return this.repo.softDeleteCampaign(id);
  }

  async sendCampaign(id: string, organizationId: string, userId: string) {
    const campaign = await this.findCampaignById(id, organizationId);
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Chiến dịch này đã được gửi');
    }
    if (campaign.status === 'SENDING') {
      throw new BadRequestException('Chiến dịch đang trong quá trình gửi');
    }

    // Đánh dấu SENDING ngay lập tức, sau đó enqueue job async
    await this.repo.markCampaignSending(id, userId);

    const jobData: SendCampaignJob = { campaignId: id, organizationId, userId };
    await this.emailQueue.add('send-campaign', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 86_400 }, // giữ 24h
      removeOnFail: { age: 7 * 86_400 }, // giữ 7 ngày
    });

    return { id, status: 'SENDING', message: 'Chiến dịch đang được xử lý' };
  }

  async getCampaignStats(organizationId: string) {
    return this.repo.getCampaignStats(organizationId);
  }
}
