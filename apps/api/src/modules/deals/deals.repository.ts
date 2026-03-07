import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DealStatus, Prisma } from '@prisma/client';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { StageInputDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';

// =====================
// PIPELINE QUERIES
// =====================

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Pipeline ----------

  async findPipelines(organizationId: string) {
    return this.prisma.pipeline.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: { select: { stages: true, deals: { where: { deletedAt: null } } } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findPipelineById(id: string, organizationId: string) {
    return this.prisma.pipeline.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: { select: { deals: { where: { deletedAt: null } } } },
      },
    });
  }

  async createPipeline(
    organizationId: string,
    data: { name: string; description?: string; isDefault?: boolean },
    stages?: StageInputDto[],
    userId?: string,
  ) {
    return this.prisma.pipeline.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault ?? false,
        createdById: userId,
        // Seed stages nếu có
        stages: stages?.length
          ? {
              create: stages.map((s) => ({
                organizationId,
                name: s.name,
                order: s.order,
                color: s.color ?? '#6B7280',
                probability: s.probability ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async updatePipeline(
    id: string,
    organizationId: string,
    data: Partial<{ name: string; description: string; isDefault: boolean }>,
  ) {
    await this.prisma.pipeline.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
    return this.prisma.pipeline.findFirst({
      where: { id, organizationId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async softDeletePipeline(id: string, organizationId: string) {
    await this.prisma.pipeline.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { id };
  }

  async createStage(pipelineId: string, organizationId: string, data: CreateStageDto) {
    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        organizationId,
        name: data.name,
        order: data.order,
        color: data.color ?? '#6B7280',
        probability: data.probability ?? 0,
      },
    });
  }

  async updateStage(stageId: string, pipelineId: string, data: Partial<CreateStageDto>) {
    // pipelineId dùng để enforce stage thuộc đúng pipeline
    await this.prisma.pipelineStage.updateMany({
      where: { id: stageId, pipelineId },
      data,
    });
    return this.prisma.pipelineStage.findFirst({
      where: { id: stageId, pipelineId },
    });
  }

  async deleteStage(stageId: string, pipelineId: string) {
    // Dùng deleteMany để enforce pipelineId filter
    await this.prisma.pipelineStage.deleteMany({
      where: { id: stageId, pipelineId },
    });
    return { id: stageId };
  }

  async reorderStages(stageOrders: { id: string; order: number }[]) {
    // Cập nhật order trong transaction để tránh conflict
    return this.prisma.$transaction(
      stageOrders.map(({ id, order }) =>
        this.prisma.pipelineStage.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  async countDealsInStage(stageId: string): Promise<number> {
    return this.prisma.deal.count({
      where: { stageId, deletedAt: null },
    });
  }

  async countDealsInPipeline(pipelineId: string): Promise<number> {
    return this.prisma.deal.count({
      where: { pipelineId, deletedAt: null },
    });
  }

  // ---------- Deal ----------

  async create(organizationId: string, dto: CreateDealDto, userId: string) {
    return this.prisma.deal.create({
      data: {
        organizationId,
        title: dto.title,
        value: dto.value,
        currency: dto.currency ?? 'VND',
        status: dto.status ?? DealStatus.OPEN,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        contactId: dto.contactId,
        assignedToId: dto.assignedToId,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        notes: dto.notes,
        createdById: userId,
        updatedById: userId,
      },
      include: DEAL_INCLUDE,
    });
  }

  async findAll(organizationId: string, query: QueryDealDto) {
    const {
      pipelineId,
      stageId,
      status,
      contactId,
      assignedToId,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.DealWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (pipelineId) where.pipelineId = pipelineId;
    if (stageId) where.stageId = stageId;
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: DEAL_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.deal.count({ where }),
    ]);

    return { items, total };
  }

  async findKanban(pipelineId: string, organizationId: string) {
    // Lấy tất cả stages của pipeline, mỗi stage kèm deals của nó
    return this.prisma.pipelineStage.findMany({
      where: { pipelineId, organizationId },
      include: {
        deals: {
          where: { deletedAt: null },
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.deal.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        ...DEAL_INCLUDE,
        pipeline: {
          include: { stages: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateDealDto, userId: string) {
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        updatedById: userId,
      },
      include: DEAL_INCLUDE,
    });
  }

  async moveDeal(id: string, organizationId: string, stageId: string, userId: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { stageId, updatedById: userId },
      include: DEAL_INCLUDE,
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async findStageInOrg(stageId: string, organizationId: string) {
    return this.prisma.pipelineStage.findFirst({
      where: { id: stageId, organizationId },
      select: { id: true },
    });
  }

  async getStats(organizationId: string, pipelineId?: string) {
    const where: Prisma.DealWhereInput = {
      organizationId,
      deletedAt: null,
      ...(pipelineId && { pipelineId }),
    };

    // Thống kê tổng hợp: count và value theo status
    const [total, byStatus, valueAgg] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where,
        _sum: { value: true },
      }),
    ]);

    // Tổng hợp theo status thành object dễ dùng
    const statusStats: Record<DealStatus, { count: number; totalValue: number }> = {
      OPEN: { count: 0, totalValue: 0 },
      WON: { count: 0, totalValue: 0 },
      LOST: { count: 0, totalValue: 0 },
    };

    for (const row of byStatus) {
      statusStats[row.status] = {
        count: row._count.status,
        totalValue: row._sum.value ?? 0,
      };
    }

    // Win rate = số WON / (WON + LOST)
    const closed = statusStats.WON.count + statusStats.LOST.count;
    const winRate = closed > 0 ? Math.round((statusStats.WON.count / closed) * 100) : 0;

    return {
      total,
      totalValue: valueAgg._sum.value ?? 0,
      winRate,
      byStatus: statusStats,
    };
  }
}

// ---------- Shared includes ----------
const DEAL_INCLUDE = {
  stage: { select: { id: true, name: true, color: true, probability: true, order: true } },
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DealInclude;
