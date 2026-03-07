import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiKeysService, CreateApiKeyDto } from './api-keys.service';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  /** GET /api-keys — danh sách API keys */
  @Get()
  async findAll(@CurrentUser() user: { organizationId: string }) {
    return { data: await this.svc.findAll(user.organizationId) };
  }

  /**
   * POST /api-keys — tạo API key mới
   * Body: { name, scopes?, expiresInDays? }
   * Response bao gồm rawKey (chỉ hiển thị 1 lần)
   */
  @Post()
  async create(
    @CurrentUser() user: { sub: string; organizationId: string },
    @Body() dto: CreateApiKeyDto,
  ) {
    return { data: await this.svc.create(user.organizationId, user.sub, dto) };
  }

  /** DELETE /api-keys/:id — thu hồi API key */
  @Delete(':id')
  async revoke(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    return { data: await this.svc.revoke(id, user.organizationId) };
  }
}
