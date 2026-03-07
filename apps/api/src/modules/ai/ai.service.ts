import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from '@fuviai/ai';
import type { OrganizationContext } from '@fuviai/ai';
import { ChatDto } from './dto/chat.dto';
import { EmailWriterDto } from './dto/email-writer.dto';

@Injectable()
export class AiService {
  private openai: OpenAIService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    this.openai = new OpenAIService(apiKey);
  }

  // =====================
  // FUVIBOT CHAT
  // =====================

  async chat(dto: ChatDto, ctx: OrganizationContext) {
    const reply = await this.openai.chat(dto.messages, ctx);
    return { reply };
  }

  // =====================
  // LEAD SCORING
  // =====================

  async scoreContact(contactId: string, organizationId: string) {
    // Lấy thông tin contact + stats liên quan
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        deals: { where: { deletedAt: null }, select: { value: true, status: true } },
        activities: { where: { deletedAt: null }, select: { id: true } },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Không tìm thấy contact với ID: ${contactId}`);
    }

    const daysSinceCreated = Math.floor(
      (Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const totalDealValue = contact.deals.reduce(
      (sum, d) => sum + (d.value ? Number(d.value) : 0),
      0,
    );

    const result = await this.openai.scoreContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      website: contact.website,
      status: contact.status,
      dealsCount: contact.deals.length,
      totalDealValue,
      activitiesCount: contact.activities.length,
      daysSinceCreated,
      tags: contact.tags.map((ct) => ct.tag.name),
    });

    // Lưu score vào DB
    await this.prisma.contact.update({
      where: { id: contactId },
      data: { aiScore: result.score },
    });

    return result;
  }

  // =====================
  // EMAIL WRITER
  // =====================

  async writeEmail(dto: EmailWriterDto) {
    return this.openai.writeEmail(dto);
  }
}
