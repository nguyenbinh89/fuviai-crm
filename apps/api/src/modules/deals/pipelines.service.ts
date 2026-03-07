import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DealsRepository } from './deals.repository';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';

// Stages mặc định khi tạo pipeline mới không có stages
const DEFAULT_STAGES = [
  { name: 'Tiếp cận', order: 0, color: '#3B82F6', probability: 10 },
  { name: 'Đề xuất', order: 1, color: '#F59E0B', probability: 40 },
  { name: 'Đàm phán', order: 2, color: '#8B5CF6', probability: 70 },
  { name: 'Chốt đơn', order: 3, color: '#10B981', probability: 100 },
];

@Injectable()
export class PipelinesService {
  constructor(private readonly repo: DealsRepository) {}

  async findAll(organizationId: string) {
    return this.repo.findPipelines(organizationId);
  }

  async findById(id: string, organizationId: string) {
    const pipeline = await this.repo.findPipelineById(id, organizationId);
    if (!pipeline) {
      throw new NotFoundException(`Không tìm thấy pipeline với ID: ${id}`);
    }
    return pipeline;
  }

  async create(organizationId: string, dto: CreatePipelineDto, userId: string) {
    // Nếu không có stages trong dto thì seed stages mặc định
    const stages = dto.stages?.length ? dto.stages : DEFAULT_STAGES;
    return this.repo.createPipeline(
      organizationId,
      { name: dto.name, description: dto.description, isDefault: dto.isDefault },
      stages,
      userId,
    );
  }

  async update(id: string, organizationId: string, dto: Partial<CreatePipelineDto>) {
    await this.findById(id, organizationId);
    return this.repo.updatePipeline(id, organizationId, {
      name: dto.name,
      description: dto.description,
      isDefault: dto.isDefault,
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);

    // Không cho xóa nếu còn deals active
    const dealCount = await this.repo.countDealsInPipeline(id);
    if (dealCount > 0) {
      throw new ConflictException(
        `Pipeline vẫn còn ${dealCount} deal. Hãy chuyển hoặc xóa các deal trước.`,
      );
    }

    return this.repo.softDeletePipeline(id, organizationId);
  }

  async addStage(pipelineId: string, organizationId: string, dto: CreateStageDto) {
    await this.findById(pipelineId, organizationId);
    return this.repo.createStage(pipelineId, organizationId, dto);
  }

  async updateStage(
    pipelineId: string,
    stageId: string,
    organizationId: string,
    dto: Partial<CreateStageDto>,
  ) {
    // Kiểm tra pipeline tồn tại và thuộc org
    const pipeline = await this.findById(pipelineId, organizationId);
    const stage = pipeline.stages.find((s) => s.id === stageId);
    if (!stage) {
      throw new NotFoundException(`Không tìm thấy stage với ID: ${stageId}`);
    }
    return this.repo.updateStage(stageId, pipelineId, dto);
  }

  async removeStage(pipelineId: string, stageId: string, organizationId: string) {
    // Kiểm tra pipeline tồn tại
    const pipeline = await this.findById(pipelineId, organizationId);
    const stage = pipeline.stages.find((s) => s.id === stageId);
    if (!stage) {
      throw new NotFoundException(`Không tìm thấy stage với ID: ${stageId}`);
    }

    // Không cho xóa stage nếu còn deals
    const dealCount = await this.repo.countDealsInStage(stageId);
    if (dealCount > 0) {
      throw new ConflictException(
        `Stage vẫn còn ${dealCount} deal. Hãy chuyển deals sang stage khác trước.`,
      );
    }

    return this.repo.deleteStage(stageId, pipelineId);
  }

  async reorderStages(
    pipelineId: string,
    organizationId: string,
    orders: { id: string; order: number }[],
  ) {
    // Kiểm tra pipeline tồn tại
    await this.findById(pipelineId, organizationId);
    return this.repo.reorderStages(orders);
  }
}
