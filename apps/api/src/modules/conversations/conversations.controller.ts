import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ZaloWebhookDto } from './dto/zalo-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationChannel } from '@prisma/client';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly svc: ConversationsService) {}

  // GET /api/v1/conversations/stats — TRƯỚC /:id
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê hộp thư' })
  async getStats(@CurrentUser() user: { organizationId: string }) {
    const data = await this.svc.getStats(user.organizationId);
    return { data };
  }

  // POST /api/v1/conversations — Tạo conversation mới
  @Post()
  @ApiOperation({ summary: 'Tạo conversation mới' })
  async create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/conversations
  @Get()
  @ApiOperation({ summary: 'Danh sách conversations' })
  @ApiQuery({ name: 'channel', required: false, enum: ConversationChannel })
  @ApiQuery({ name: 'isOpen', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('channel') channel: ConversationChannel | undefined,
    @Query('isOpen') isOpen: string | undefined,
    @Query('contactId') contactId: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: { organizationId: string },
  ) {
    const result = await this.svc.findAll(user.organizationId, {
      channel,
      isOpen: isOpen !== undefined ? isOpen === 'true' : undefined,
      contactId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 30,
    });
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  // GET /api/v1/conversations/:id
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết conversation + messages' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.findById(id, user.organizationId);
    return { data };
  }

  // POST /api/v1/conversations/:id/messages — Gửi tin nhắn
  @Post(':id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong conversation' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.sendMessage(id, user.organizationId, dto, user.id);
    return { data };
  }

  // PATCH /api/v1/conversations/:id/close
  @Patch(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đóng conversation (resolved)' })
  async close(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.close(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/conversations/:id/reopen
  @Patch(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mở lại conversation' })
  async reopen(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.reopen(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/conversations/:id/assign
  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gán conversation cho nhân viên' })
  async assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.assign(id, user.organizationId, assignedToId);
    return { data };
  }
}

// =====================
// ZALO WEBHOOK CONTROLLER — public endpoint, không cần JWT
// =====================
import { Controller as NestController } from '@nestjs/common';

@ApiTags('zalo-webhook')
@NestController('webhooks/zalo')
export class ZaloWebhookController {
  constructor(private readonly svc: ConversationsService) {}

  // GET /api/v1/webhooks/zalo?hub.challenge=... — Zalo verification
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Zalo OA webhook verification' })
  verifyWebhook(@Query('hub.challenge') challenge: string) {
    // Trả về hub.challenge để Zalo xác nhận webhook URL
    return challenge ?? 'OK';
  }

  // POST /api/v1/webhooks/zalo/:orgId — nhận tin từ Zalo
  @Post(':orgId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nhận webhook event từ Zalo OA' })
  async receiveWebhook(
    @Param('orgId') orgId: string,
    @Body() payload: ZaloWebhookDto,
  ) {
    const result = await this.svc.handleZaloWebhook(payload, orgId);
    return result;
  }
}
