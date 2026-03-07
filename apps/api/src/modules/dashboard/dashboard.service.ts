import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** Helper: đọc cache trước, nếu miss thì query và lưu cache */
  private async cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = await this.cache.get<T>(key);
    if (hit !== undefined && hit !== null) return hit;
    const result = await fn();
    await this.cache.set(key, result, ttlMs);
    return result;
  }

  // =====================
  // KPI TỔNG QUAN
  // =====================
  async getOverview(organizationId: string) {
    return this.cached(`dashboard:overview:${organizationId}`, 60_000, () =>
      this._getOverview(organizationId),
    );
  }

  private async _getOverview(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalContacts,
      newContactsThisMonth,
      newContactsLastMonth,
      totalDeals,
      wonDealsThisMonth,
      wonDealsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      openConversations,
      pendingActivities,
      activeWorkflows,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId, deletedAt: null } }),

      this.prisma.contact.count({
        where: { organizationId, deletedAt: null, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.contact.count({
        where: {
          organizationId, deletedAt: null,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      this.prisma.deal.count({ where: { organizationId, deletedAt: null } }),

      this.prisma.deal.count({
        where: { organizationId, deletedAt: null, status: 'WON', updatedAt: { gte: startOfMonth } },
      }),
      this.prisma.deal.count({
        where: {
          organizationId, deletedAt: null, status: 'WON',
          updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      this.prisma.deal.aggregate({
        where: { organizationId, deletedAt: null, status: 'WON', updatedAt: { gte: startOfMonth } },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          organizationId, deletedAt: null, status: 'WON',
          updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { value: true },
      }),

      this.prisma.conversation.count({ where: { organizationId, isOpen: true, deletedAt: null } }),
      this.prisma.activity.count({ where: { organizationId, status: 'PENDING', deletedAt: null } }),
      this.prisma.workflowAutomation.count({ where: { organizationId, status: 'ACTIVE', deletedAt: null } }),
    ]);

    const revThisMonth = Number(revenueThisMonth._sum.value ?? 0);
    const revLastMonth = Number(revenueLastMonth._sum.value ?? 0);

    return {
      contacts: {
        total: totalContacts,
        thisMonth: newContactsThisMonth,
        growth: this.calcGrowth(newContactsThisMonth, newContactsLastMonth),
      },
      deals: {
        total: totalDeals,
        wonThisMonth: wonDealsThisMonth,
        growth: this.calcGrowth(wonDealsThisMonth, wonDealsLastMonth),
      },
      revenue: {
        thisMonth: revThisMonth,
        lastMonth: revLastMonth,
        growth: this.calcGrowth(revThisMonth, revLastMonth),
      },
      conversations: { open: openConversations },
      activities: { pending: pendingActivities },
      workflows: { active: activeWorkflows },
    };
  }

  // =====================
  // BIỂU ĐỒ DOANH THU THEO THÁNG (12 tháng gần nhất)
  // =====================
  getRevenueChart(organizationId: string) {
    return this.cached(`dashboard:revenue-chart:${organizationId}`, 120_000, () =>
      this._getRevenueChart(organizationId),
    );
  }

  private async _getRevenueChart(organizationId: string) {
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `T${d.getMonth() + 1}/${d.getFullYear()}`,
      });
    }

    // Lấy tất cả won deals trong 12 tháng qua
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const wonDeals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'WON',
        updatedAt: { gte: startDate },
      },
      select: { value: true, updatedAt: true },
    });

    // Group theo tháng
    const revenueMap: Record<string, number> = {};
    const dealsMap: Record<string, number> = {};

    for (const deal of wonDeals) {
      const d = deal.updatedAt;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      revenueMap[key] = (revenueMap[key] ?? 0) + Number(deal.value ?? 0);
      dealsMap[key] = (dealsMap[key] ?? 0) + 1;
    }

    return months.map(({ year, month, label }) => {
      const key = `${year}-${month}`;
      return {
        label,
        revenue: revenueMap[key] ?? 0,
        deals: dealsMap[key] ?? 0,
      };
    });
  }

  // =====================
  // PIPELINE FUNNEL
  // =====================
  async getPipelineFunnel(organizationId: string, pipelineId?: string) {
    // Lấy pipeline mặc định (đầu tiên) nếu không truyền
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        ...(pipelineId ? { id: pipelineId } : {}),
      },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: { where: { deletedAt: null, status: 'OPEN' } } } },
            deals: {
              where: { deletedAt: null, status: 'OPEN' },
              select: { value: true },
            },
          },
        },
      },
    });

    if (!pipeline) return [];

    return pipeline.stages.map((stage) => ({
      stageName: stage.name,
      stageColor: stage.color,
      dealCount: stage._count.deals,
      totalValue: stage.deals.reduce((sum, d) => sum + Number(d.value ?? 0), 0),
    }));
  }

  // =====================
  // THỐNG KÊ ACTIVITY THEO TYPE
  // =====================
  async getActivitySummary(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activities = await this.prisma.activity.groupBy({
      by: ['type', 'status'],
      where: { organizationId, deletedAt: null, createdAt: { gte: startOfMonth } },
      _count: { id: true },
    });

    // Restructure: { type: { PENDING: N, DONE: N, CANCELLED: N } }
    const result: Record<string, Record<string, number>> = {};
    for (const row of activities) {
      if (!result[row.type]) result[row.type] = { PENDING: 0, DONE: 0, CANCELLED: 0 };
      result[row.type][row.status] = row._count.id;
    }

    return Object.entries(result).map(([type, counts]) => ({
      type,
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    }));
  }

  // =====================
  // TOP DEALS (Đang mở, giá trị cao nhất)
  // =====================
  async getTopDeals(organizationId: string, limit = 5) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId, deletedAt: null, status: 'OPEN' },
      orderBy: { value: 'desc' },
      take: limit,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        stage: { select: { name: true } },
      },
    });

    return deals.map((d) => ({
      id: d.id,
      title: d.title,
      value: Number(d.value ?? 0),
      stage: d.stage.name,
      contact: [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' '),
      probability: d.probability,
    }));
  }

  // =====================
  // RECENT ACTIVITIES
  // =====================
  async getRecentActivity(organizationId: string, limit = 10) {
    const activities = await this.prisma.activity.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        deal: { select: { title: true } },
        assignedTo: { select: { firstName: true } },
      },
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      status: a.status,
      dueDate: a.dueDate,
      createdAt: a.createdAt,
      contact: a.contact
        ? [a.contact.firstName, a.contact.lastName].filter(Boolean).join(' ')
        : null,
      deal: a.deal?.title ?? null,
      assignedTo: a.assignedTo?.firstName ?? null,
    }));
  }

  // =====================
  // CONVERSION RATE (contacts → deals → won)
  // =====================
  async getConversionStats(organizationId: string) {
    const [totalContacts, totalDeals, wonDeals, lostDeals] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.deal.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.deal.count({ where: { organizationId, deletedAt: null, status: 'WON' } }),
      this.prisma.deal.count({ where: { organizationId, deletedAt: null, status: 'LOST' } }),
    ]);

    const closedDeals = wonDeals + lostDeals;
    return {
      totalContacts,
      totalDeals,
      wonDeals,
      lostDeals,
      openDeals: totalDeals - closedDeals,
      winRate: closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0,
      contactToDeal: totalContacts > 0 ? Math.round((totalDeals / totalContacts) * 100) : 0,
    };
  }

  // Helper
  private calcGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
