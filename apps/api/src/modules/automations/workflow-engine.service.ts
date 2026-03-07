import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationsRepository } from './automations.repository';
import { TriggerType, ActionType } from '@prisma/client';

export interface TriggerContext {
  organizationId: string;
  triggerType: TriggerType;
  contactId?: string;
  dealId?: string;
  conversationId?: string;
  stageId?: string;
  [key: string]: any;
}

interface ActionConfig {
  // SEND_EMAIL
  templateId?: string;
  // SEND_ZALO
  message?: string;
  // CREATE_ACTIVITY
  activityType?: string;
  subject?: string;
  dueInDays?: number;
  // UPDATE_CONTACT_STATUS
  contactStatus?: string;
  // UPDATE_DEAL_STAGE
  stageId?: string;
  // ASSIGN_TO_USER
  userId?: string;
  // ADD_TAG
  tagId?: string;
  // SEND_WEBHOOK
  url?: string;
  method?: string;
  body?: Record<string, any>;
  // WAIT
  waitDays?: number;
  waitHours?: number;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsRepo: AutomationsRepository,
  ) {}

  // Kích hoạt tất cả workflows phù hợp với trigger event
  async trigger(ctx: TriggerContext): Promise<void> {
    const workflows = await this.automationsRepo.findActiveByTrigger(
      ctx.organizationId,
      ctx.triggerType,
    );

    for (const workflow of workflows) {
      // Kiểm tra triggerConditions
      if (!this.matchesConditions(workflow.triggerConditions as Record<string, any>, ctx)) {
        continue;
      }

      // Chạy workflow không đồng bộ (fire-and-forget per workflow)
      this.executeWorkflow(workflow, ctx).catch((err) => {
        this.logger.error(`Workflow ${workflow.id} failed: ${err.message}`);
      });
    }
  }

  // Chạy 1 workflow cụ thể (dùng cho manual trigger)
  async executeWorkflow(
    workflow: { id: string; actions: any },
    ctx: TriggerContext,
  ): Promise<void> {
    const run = await this.automationsRepo.createRun(workflow.id, ctx);
    const actionResults: any[] = [];

    try {
      const actions: Array<{ type: ActionType; order: number; config: ActionConfig }> =
        Array.isArray(workflow.actions) ? workflow.actions : [];

      // Sắp xếp theo order
      actions.sort((a, b) => a.order - b.order);

      for (const action of actions) {
        const result = await this.executeAction(action.type, action.config, ctx);
        actionResults.push({
          actionIndex: action.order,
          type: action.type,
          status: 'SUCCESS',
          result,
        });
      }

      await this.automationsRepo.updateRun(run.id, {
        status: 'COMPLETED',
        actionResults,
        completedAt: new Date(),
      });

      await this.automationsRepo.incrementRunCount(workflow.id);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      await this.automationsRepo.updateRun(run.id, {
        status: 'FAILED',
        actionResults,
        error,
        completedAt: new Date(),
      });
      this.logger.error(`Workflow run ${run.id} failed: ${error}`);
    }
  }

  // Thực thi 1 action cụ thể
  private async executeAction(
    type: ActionType,
    config: ActionConfig,
    ctx: TriggerContext,
  ): Promise<any> {
    switch (type) {
      case 'SEND_EMAIL':
        return this.actionSendEmail(config, ctx);
      case 'SEND_ZALO':
        return this.actionSendZalo(config, ctx);
      case 'CREATE_ACTIVITY':
        return this.actionCreateActivity(config, ctx);
      case 'UPDATE_CONTACT_STATUS':
        return this.actionUpdateContactStatus(config, ctx);
      case 'UPDATE_DEAL_STAGE':
        return this.actionUpdateDealStage(config, ctx);
      case 'ASSIGN_TO_USER':
        return this.actionAssignToUser(config, ctx);
      case 'ADD_TAG':
        return this.actionAddTag(config, ctx);
      case 'SEND_WEBHOOK':
        return this.actionSendWebhook(config, ctx);
      case 'WAIT':
        return this.actionWait(config);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  // =====================
  // ACTION IMPLEMENTATIONS
  // =====================

  private async actionSendEmail(config: ActionConfig, ctx: TriggerContext) {
    // TODO: Tích hợp với EmailMarketingService thực tế
    // Hiện tại log simulate
    this.logger.log(`[WORKFLOW] SEND_EMAIL templateId=${config.templateId} to contactId=${ctx.contactId}`);
    return { simulated: true, templateId: config.templateId };
  }

  private async actionSendZalo(config: ActionConfig, ctx: TriggerContext) {
    // TODO: Tích hợp với Zalo OA API thực tế
    this.logger.log(`[WORKFLOW] SEND_ZALO message="${config.message}" to contactId=${ctx.contactId}`);
    return { simulated: true, message: config.message };
  }

  private async actionCreateActivity(config: ActionConfig, ctx: TriggerContext) {
    if (!ctx.contactId && !ctx.dealId) return { skipped: true, reason: 'No contactId or dealId' };

    const dueDate = new Date();
    if (config.dueInDays) dueDate.setDate(dueDate.getDate() + config.dueInDays);

    const activity = await this.prisma.activity.create({
      data: {
        organizationId: ctx.organizationId,
        type: (config.activityType as any) ?? 'TASK',
        subject: config.subject ?? 'Auto-created activity',
        status: 'PENDING',
        dueDate,
        ...(ctx.contactId && { contactId: ctx.contactId }),
        ...(ctx.dealId && { dealId: ctx.dealId }),
      },
    });

    return { activityId: activity.id };
  }

  private async actionUpdateContactStatus(config: ActionConfig, ctx: TriggerContext) {
    if (!ctx.contactId) return { skipped: true, reason: 'No contactId' };

    const contact = await this.prisma.contact.update({
      where: { id: ctx.contactId },
      data: { status: config.contactStatus as any },
    });

    return { contactId: contact.id, newStatus: contact.status };
  }

  private async actionUpdateDealStage(config: ActionConfig, ctx: TriggerContext) {
    if (!ctx.dealId || !config.stageId) return { skipped: true, reason: 'No dealId or stageId' };

    const deal = await this.prisma.deal.update({
      where: { id: ctx.dealId },
      data: { stageId: config.stageId },
    });

    return { dealId: deal.id, newStageId: config.stageId };
  }

  private async actionAssignToUser(config: ActionConfig, ctx: TriggerContext) {
    if (!config.userId) return { skipped: true, reason: 'No userId in config' };

    const updates: any = {};
    if (ctx.dealId) {
      await this.prisma.deal.update({
        where: { id: ctx.dealId },
        data: { assignedToId: config.userId },
      });
      updates.dealId = ctx.dealId;
    }
    if (ctx.conversationId) {
      await this.prisma.conversation.update({
        where: { id: ctx.conversationId },
        data: { assignedToId: config.userId },
      });
      updates.conversationId = ctx.conversationId;
    }

    return { assignedToUserId: config.userId, ...updates };
  }

  private async actionAddTag(config: ActionConfig, ctx: TriggerContext) {
    if (!ctx.contactId || !config.tagId) return { skipped: true, reason: 'No contactId or tagId' };

    // Upsert ContactTag (bỏ qua nếu đã có)
    await this.prisma.contactTag.upsert({
      where: {
        contactId_tagId: { contactId: ctx.contactId, tagId: config.tagId },
      },
      create: { contactId: ctx.contactId, tagId: config.tagId },
      update: {},
    });

    return { contactId: ctx.contactId, tagId: config.tagId };
  }

  private async actionSendWebhook(config: ActionConfig, ctx: TriggerContext) {
    if (!config.url) return { skipped: true, reason: 'No URL in config' };

    try {
      const response = await fetch(config.url, {
        method: config.method ?? 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(config.body ?? {}), context: ctx }),
      });
      return { status: response.status, ok: response.ok };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      throw new Error(`Webhook failed: ${msg}`);
    }
  }

  private async actionWait(config: ActionConfig) {
    // Trong production nên dùng BullMQ delay jobs
    // Simulate ngay để không block
    const ms = ((config.waitDays ?? 0) * 24 * 60 + (config.waitHours ?? 0) * 60) * 60 * 1000;
    this.logger.log(`[WORKFLOW] WAIT ${ms}ms (simulated, not blocking)`);
    return { simulated: true, plannedWaitMs: ms };
  }

  // =====================
  // HELPERS
  // =====================

  // Kiểm tra trigger conditions có khớp với context không
  private matchesConditions(conditions: Record<string, any>, ctx: TriggerContext): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (ctx[key] !== value) return false;
    }
    return true;
  }
}
