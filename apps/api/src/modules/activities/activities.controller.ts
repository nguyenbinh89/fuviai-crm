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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // POST /api/v1/activities
  @Post()
  @ApiOperation({ summary: 'Tạo activity mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.activitiesService.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/activities/calendar — PHẢI đặt trước /:id
  @Get('calendar')
  @ApiOperation({ summary: 'Lấy activities theo tháng cho calendar view' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Ngày bắt đầu (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'Ngày kết thúc (ISO 8601)' })
  async getCalendar(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.activitiesService.findCalendar(user.organizationId, dateFrom, dateTo);
    return { data };
  }

  // GET /api/v1/activities/upcoming — PHẢI đặt trước /:id
  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy activities PENDING trong 7 ngày tới' })
  async getUpcoming(@CurrentUser() user: { organizationId: string }) {
    const data = await this.activitiesService.findUpcoming(user.organizationId);
    return { data };
  }

  // GET /api/v1/activities
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách activities có filter/pagination' })
  async findAll(
    @Query() query: QueryActivityDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const result = await this.activitiesService.findAll(user.organizationId, query);
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  // GET /api/v1/activities/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 activity' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.activitiesService.findById(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/activities/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật activity' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.activitiesService.update(id, user.organizationId, dto, user.id);
    return { data };
  }

  // PATCH /api/v1/activities/:id/complete
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Đánh dấu activity là hoàn thành' })
  async markComplete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.activitiesService.complete(id, user.organizationId, user.id);
    return { data };
  }

  // DELETE /api/v1/activities/:id — ADMIN+
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa activity (soft delete, ADMIN+)' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.activitiesService.delete(id, user.organizationId);
    return { data: { message: 'Đã xóa activity thành công' } };
  }
}
