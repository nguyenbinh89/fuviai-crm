import { Injectable, NotFoundException } from '@nestjs/common';
import { DealsRepository } from './deals.repository';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';

@Injectable()
export class DealsService {
  constructor(private readonly repo: DealsRepository) {}

  // =====================
  // CREATE
  // =====================

  async create(organizationId: string, dto: CreateDealDto, userId: string) {
    // Validate pipeline thuộc org
    const pipeline = await this.repo.findPipelineById(dto.pipelineId, organizationId);
    if (!pipeline) {
      throw new NotFoundException(`Không tìm thấy pipeline với ID: ${dto.pipelineId}`);
    }

    // Validate stage thuộc pipeline
    const stageExists = pipeline.stages.some((s) => s.id === dto.stageId);
    if (!stageExists) {
      throw new NotFoundException(
        `Stage ${dto.stageId} không thuộc pipeline ${dto.pipelineId}`,
      );
    }

    return this.repo.create(organizationId, dto, userId);
  }

  // =====================
  // FIND ALL (paginated)
  // =====================

  async findAll(organizationId: string, query: QueryDealDto) {
    const { items, total } = await this.repo.findAll(organizationId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return { items, total, page, limit };
  }

  // =====================
  // KANBAN VIEW
  // =====================

  async findKanban(pipelineId: string, organizationId: string) {
    // Validate pipeline
    const pipeline = await this.repo.findPipelineById(pipelineId, organizationId);
    if (!pipeline) {
      throw new NotFoundException(`Không tìm thấy pipeline với ID: ${pipelineId}`);
    }

    const stages = await this.repo.findKanban(pipelineId, organizationId);
    return { pipeline: { id: pipeline.id, name: pipeline.name }, stages };
  }

  // =====================
  // FIND BY ID
  // =====================

  async findById(id: string, organizationId: string) {
    const deal = await this.repo.findById(id, organizationId);
    if (!deal) {
      throw new NotFoundException(`Không tìm thấy deal với ID: ${id}`);
    }
    return deal;
  }

  // =====================
  // UPDATE
  // =====================

  async update(id: string, organizationId: string, dto: UpdateDealDto, userId: string) {
    await this.findById(id, organizationId);
    return this.repo.update(id, organizationId, dto, userId);
  }

  // =====================
  // MOVE DEAL
  // =====================

  async moveDeal(id: string, organizationId: string, stageId: string, userId: string) {
    // Kiểm tra deal tồn tại
    await this.findById(id, organizationId);

    // Kiểm tra stage đích tồn tại trong org
    const stage = await this.repo.findStageInOrg(stageId, organizationId);
    if (!stage) {
      throw new NotFoundException(`Không tìm thấy stage với ID: ${stageId}`);
    }

    return this.repo.moveDeal(id, organizationId, stageId, userId);
  }

  // =====================
  // DELETE
  // =====================

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.repo.softDelete(id, organizationId);
  }

  // =====================
  // STATS
  // =====================

  async getStats(organizationId: string, pipelineId?: string) {
    return this.repo.getStats(organizationId, pipelineId);
  }
}
