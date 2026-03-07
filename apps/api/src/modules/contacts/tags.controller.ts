import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService, CreateTagDto } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // GET /api/v1/tags
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tags của org' })
  async findAll(@CurrentUser() user: { organizationId: string }) {
    const data = await this.tagsService.findAll(user.organizationId);
    return { data };
  }

  // POST /api/v1/tags
  @Post()
  @ApiOperation({ summary: 'Tạo tag mới' })
  async create(
    @Body() dto: CreateTagDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.tagsService.create(user.organizationId, dto);
    return { data };
  }

  // DELETE /api/v1/tags/:id — ADMIN+
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa tag (ADMIN+)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.tagsService.delete(id, user.organizationId);
    return { data };
  }
}
