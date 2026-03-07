import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  // GET /api/v1/pipelines
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách pipelines' })
  async findAll(@CurrentUser() user: { organizationId: string }) {
    const data = await this.pipelinesService.findAll(user.organizationId);
    return { data };
  }

  // POST /api/v1/pipelines — ADMIN+
  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Tạo pipeline mới (ADMIN+)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @Body() dto: CreatePipelineDto,
    @CurrentUser() user: { id: string; organizationId: string },
  ) {
    const data = await this.pipelinesService.create(user.organizationId, dto, user.id);
    return { data };
  }

  // GET /api/v1/pipelines/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết pipeline kèm stages' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.pipelinesService.findById(id, user.organizationId);
    return { data };
  }

  // PATCH /api/v1/pipelines/:id — ADMIN+
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cập nhật pipeline (ADMIN+)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePipelineDto>,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.pipelinesService.update(id, user.organizationId, dto);
    return { data };
  }

  // DELETE /api/v1/pipelines/:id — ADMIN+
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa pipeline (ADMIN+, chỉ xóa được khi không còn deals)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.pipelinesService.delete(id, user.organizationId);
    return { data: { message: 'Đã xóa pipeline thành công' } };
  }

  // POST /api/v1/pipelines/:id/stages — ADMIN+
  @Post(':id/stages')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Thêm stage vào pipeline (ADMIN+)' })
  async addStage(
    @Param('id') pipelineId: string,
    @Body() dto: CreateStageDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.pipelinesService.addStage(pipelineId, user.organizationId, dto);
    return { data };
  }

  // PATCH /api/v1/pipelines/:id/stages/reorder — ADMIN+ — PHẢI trước :stageId
  @Patch(':id/stages/reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự stages (ADMIN+)' })
  async reorderStages(
    @Param('id') pipelineId: string,
    @Body() body: { orders: { id: string; order: number }[] },
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.pipelinesService.reorderStages(
      pipelineId,
      user.organizationId,
      body.orders,
    );
    return { data };
  }

  // PATCH /api/v1/pipelines/:id/stages/:stageId — ADMIN+
  @Patch(':id/stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cập nhật stage (ADMIN+)' })
  async updateStage(
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: Partial<CreateStageDto>,
    @CurrentUser() user: { organizationId: string },
  ) {
    const data = await this.pipelinesService.updateStage(
      pipelineId,
      stageId,
      user.organizationId,
      dto,
    );
    return { data };
  }

  // DELETE /api/v1/pipelines/:id/stages/:stageId — ADMIN+
  @Delete(':id/stages/:stageId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Xóa stage (ADMIN+, chỉ xóa được khi không còn deals)' })
  async removeStage(
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.pipelinesService.removeStage(pipelineId, stageId, user.organizationId);
    return { data: { message: 'Đã xóa stage thành công' } };
  }
}
