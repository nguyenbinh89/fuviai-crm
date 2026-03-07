import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
  DefaultValuePipe, ParseIntPipe, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WebhooksService, CreateWebhookDto } from './webhooks.service';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  @Get()
  async findAll(@CurrentUser() user: { organizationId: string }) {
    return { data: await this.svc.findAll(user.organizationId) };
  }

  @Post()
  async create(
    @CurrentUser() user: { sub: string; organizationId: string },
    @Body() dto: CreateWebhookDto,
  ) {
    return { data: await this.svc.create(user.organizationId, user.sub, dto) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
    @Body() dto: Partial<CreateWebhookDto> & { isActive?: boolean },
  ) {
    return { data: await this.svc.update(id, user.organizationId, dto) };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.svc.remove(id, user.organizationId);
    return { data: { success: true } };
  }

  @Get(':id/deliveries')
  async deliveries(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return { data: await this.svc.findDeliveries(id, user.organizationId, limit) };
  }
}
