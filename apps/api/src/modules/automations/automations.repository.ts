import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TriggerType, WorkflowStatus, WorkflowRunStatus } from '@prisma/client';
import type { CreateWorkflowDto } from './dto/create-workflow.dto';
import type { UpdateWorkflowDto } from './dto/update-workflow.dto';
import type { QueryWorkflowDto } from './dto/query-workflow.dto';

@Injectable()
export class AutomationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // =====================
  // WORKFLOW CRUD
  // =====================

  async findAll(organizationId: string, query: QueryWorkflowDto) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.triggerType) where.triggerType = query.triggerType;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.workflowAutomation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { runs: true } },
        },
      }),
      this.prisma.workflowAutomation.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, organizationId: string) {
    return this.prisma.workflowAutomation.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
        _count: { select: { runs: true } },
      },
    });
  }

  async create(organizationId: string, dto: CreateWorkflowDto, createdById: string) {
    return this.prisma.workflowAutomation.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConditions: dto.triggerConditions ?? {},
        actions: dto.actions as any,
        createdById,
        updatedById: createdById,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateWorkflowDto, updatedById: string) {
    return this.prisma.workflowAutomation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType }),
        ...(dto.triggerConditions !== undefined && { triggerConditions: dto.triggerConditions }),
        ...(dto.actions !== undefined && { actions: dto.actions as any }),
        ...(dto.status !== undefined && { status: dto.status }),
        updatedById,
      },
    });
  }

  async setStatus(id: string, organizationId: string, status: WorkflowStatus) {
    return this.prisma.workflowAutomation.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: string, organizationId: string) {
    return this.prisma.workflowAutomation.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  // =====================
  // WORKFLOW RUNS
  // =====================

  async createRun(workflowId: string, triggerData: Record<string, any>) {
    return this.prisma.workflowRun.create({
      data: {
        workflowId,
        triggerData,
        status: 'RUNNING',
      },
    });
  }

  async updateRun(
    runId: string,
    data: {
      status: WorkflowRunStatus;
      actionResults?: any[];
      error?: string;
      completedAt?: Date;
    },
  ) {
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: data.status,
        ...(data.actionResults !== undefined && { actionResults: data.actionResults as any }),
        ...(data.error !== undefined && { error: data.error }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      },
    });
  }

  async incrementRunCount(workflowId: string) {
    return this.prisma.workflowAutomation.update({
      where: { id: workflowId },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
      },
    });
  }

  async findRunsByWorkflow(workflowId: string, organizationId: string) {
    return this.prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  // =====================
  // TRIGGER LOOKUP
  // =====================

  // Tìm tất cả workflows ACTIVE của 1 org theo trigger type
  async findActiveByTrigger(organizationId: string, triggerType: TriggerType) {
    return this.prisma.workflowAutomation.findMany({
      where: {
        organizationId,
        triggerType,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  // =====================
  // STATS
  // =====================

  async getStats(organizationId: string) {
    const [total, active, draft, inactive, runsToday] = await Promise.all([
      this.prisma.workflowAutomation.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.workflowAutomation.count({ where: { organizationId, status: 'ACTIVE', deletedAt: null } }),
      this.prisma.workflowAutomation.count({ where: { organizationId, status: 'DRAFT', deletedAt: null } }),
      this.prisma.workflowAutomation.count({ where: { organizationId, status: 'INACTIVE', deletedAt: null } }),
      this.prisma.workflowRun.count({
        where: {
          workflow: { organizationId },
          startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { total, active, draft, inactive, runsToday };
  }
}
