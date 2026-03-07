import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { EmailMarketingService } from './email-marketing.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('email-marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email-marketing')
export class EmailMarketingController {
  constructor(private readonly svc: EmailMarketingService) {}

  // =====================
  // TEMPLATES
  // =====================

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Tạo email template' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.createTemplate(user.organizationId, dto, user.id);
    return { data };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Lấy danh sách email templates' })
  async listTemplates(@CurrentUser() user: { organizationId: string }) {
    const data = await this.svc.findAllTemplates(user.organizationId);
    return { data };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Chi tiết email template' })
  async getTemplate(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.findTemplateById(id, user.organizationId);
    return { data };
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cập nhật email template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.updateTemplate(id, user.organizationId, dto, user.id);
    return { data };
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa email template (soft delete)' })
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.svc.deleteTemplate(id, user.organizationId);
    return { data: { message: 'Đã xóa template' } };
  }

  // =====================
  // CAMPAIGNS
  // =====================

  @Get('campaigns/stats')
  @ApiOperation({ summary: 'Thống kê tổng quan chiến dịch (TRƯỚC /:id)' })
  async getStats(@CurrentUser() user: { organizationId: string }) {
    const data = await this.svc.getCampaignStats(user.organizationId);
    return { data };
  }

  @Post('campaigns')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Tạo chiến dịch email mới' })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.createCampaign(user.organizationId, dto, user.id);
    return { data };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Danh sách chiến dịch' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listCampaigns(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: { organizationId: string },
  ) {
    const result = await this.svc.findAllCampaigns(
      user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Chi tiết chiến dịch' })
  async getCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.svc.findCampaignById(id, user.organizationId);
    return { data };
  }

  @Patch('campaigns/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cập nhật chiến dịch (chỉ DRAFT)' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCampaignDto>,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.updateCampaign(id, user.organizationId, dto, user.id);
    return { data };
  }

  @Post('campaigns/:id/send')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Gửi chiến dịch email' })
  async sendCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.svc.sendCampaign(id, user.organizationId, user.id);
    return { data };
  }

  @Delete('campaigns/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa chiến dịch (soft delete)' })
  async deleteCampaign(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.svc.deleteCampaign(id, user.organizationId);
    return { data: { message: 'Đã xóa chiến dịch' } };
  }
}
