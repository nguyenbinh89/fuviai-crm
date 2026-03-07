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
} from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // POST /api/v1/deals
  @Post()
  @ApiOperation({ summary: 'Tạo deal mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @Body() dto: CreateDealDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.dealsService.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/deals/stats — PHẢI đặt trước /:id
  @Get('stats')
  @ApiOperation({ summary: 'Thống kê deals (total, value, win rate)' })
  async getStats(
    @Query('pipelineId') pipelineId: string | undefined,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.dealsService.getStats(user.organizationId, pipelineId);
    return { data };
  }

  // GET /api/v1/deals/kanban — PHẢI đặt trước /:id
  @Get('kanban')
  @ApiOperation({ summary: 'Lấy dữ liệu Kanban board theo pipeline' })
  async getKanban(
    @Query('pipelineId') pipelineId: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.dealsService.findKanban(pipelineId, user.organizationId);
    return { data };
  }

  // GET /api/v1/deals
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách deals có filter/search/pagination' })
  async findAll(
    @Query() query: QueryDealDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const result = await this.dealsService.findAll(user.organizationId, query);
    return {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  // GET /api/v1/deals/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 deal' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.dealsService.findById(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/deals/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật deal' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.dealsService.update(id, user.organizationId, dto, user.id);
    return { data };
  }

  // PATCH /api/v1/deals/:id/move
  @Patch(':id/move')
  @ApiOperation({ summary: 'Di chuyển deal sang stage khác' })
  async moveDeal(
    @Param('id') id: string,
    @Body() dto: MoveDealDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.dealsService.moveDeal(
      id,
      user.organizationId,
      dto.stageId,
      user.id,
    );
    return { data };
  }

  // DELETE /api/v1/deals/:id — ADMIN+
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa deal (soft delete, ADMIN+)' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.dealsService.delete(id, user.organizationId);
    return { data: { message: 'Đã xóa deal thành công' } };
  }
}
