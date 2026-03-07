import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AutomationsRepository } from './automations.repository';
import { WorkflowEngineService, TriggerContext } from './workflow-engine.service';
import type { CreateWorkflowDto } from './dto/create-workflow.dto';
import type { UpdateWorkflowDto } from './dto/update-workflow.dto';
import type { QueryWorkflowDto } from './dto/query-workflow.dto';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly repo: AutomationsRepository,
    private readonly engine: WorkflowEngineService,
  ) {}

  async findAll(organizationId: string, query: QueryWorkflowDto) {
    const { data, total } = await this.repo.findAll(organizationId, query);
    return {
      data,
      meta: { total },
    };
  }

  async findById(id: string, organizationId: string) {
    const workflow = await this.repo.findById(id, organizationId);
    if (!workflow) throw new NotFoundException('Workflow không tồn tại');
    return { data: workflow };
  }

  async create(organizationId: string, dto: CreateWorkflowDto, userId: string) {
    const workflow = await this.repo.create(organizationId, dto, userId);
    return { data: workflow };
  }

  async update(id: string, organizationId: string, dto: UpdateWorkflowDto, userId: string) {
    await this.assertExists(id, organizationId);
    const workflow = await this.repo.update(id, organizationId, dto, userId);
    return { data: workflow };
  }

  async activate(id: string, organizationId: string) {
    await this.assertExists(id, organizationId);
    const workflow = await this.repo.setStatus(id, organizationId, 'ACTIVE');
    return { data: workflow };
  }

  async deactivate(id: string, organizationId: string) {
    await this.assertExists(id, organizationId);
    const workflow = await this.repo.setStatus(id, organizationId, 'INACTIVE');
    return { data: workflow };
  }

  async softDelete(id: string, organizationId: string) {
    await this.assertExists(id, organizationId);
    await this.repo.softDelete(id, organizationId);
    return { data: { success: true } };
  }

  // Kích hoạt thủ công (chỉ cho workflow MANUAL trigger hoặc admin test)
  async triggerManual(
    id: string,
    organizationId: string,
    context: Record<string, any> = {},
  ) {
    const workflow = await this.repo.findById(id, organizationId);
    if (!workflow) throw new NotFoundException('Workflow không tồn tại');

    const ctx: TriggerContext = {
      organizationId,
      triggerType: workflow.triggerType,
      ...context,
    };

    // Chạy bất đồng bộ, trả về ngay
    this.engine.executeWorkflow(workflow, ctx).catch(() => {});

    return { data: { message: 'Workflow đã được kích hoạt', workflowId: id } };
  }

  async getRuns(id: string, organizationId: string) {
    await this.assertExists(id, organizationId);
    const runs = await this.repo.findRunsByWorkflow(id, organizationId);
    return { data: runs };
  }

  async getStats(organizationId: string) {
    const stats = await this.repo.getStats(organizationId);
    return { data: stats };
  }

  // Helper
  private async assertExists(id: string, organizationId: string) {
    const workflow = await this.repo.findById(id, organizationId);
    if (!workflow) throw new NotFoundException('Workflow không tồn tại');
    return workflow;
  }
}
