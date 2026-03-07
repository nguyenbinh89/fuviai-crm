import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan, BillingCycle, SubscriptionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(organizationId: string) {
    return this.prisma.subscription.findUnique({
      where: { organizationId },
    });
  }

  async upsertSubscription(data: {
    organizationId: string;
    plan: Plan;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    priceMonthly: number;
    priceYearly: number;
    trialEndsAt?: Date;
  }) {
    return this.prisma.subscription.upsert({
      where: { organizationId: data.organizationId },
      create: data,
      update: {
        plan: data.plan,
        status: data.status,
        billingCycle: data.billingCycle,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        cancelledAt: null,
        cancelReason: null,
      },
    });
  }

  async cancelSubscription(organizationId: string, reason?: string) {
    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  async getBillingHistory(organizationId: string) {
    return this.prisma.billingHistory.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 24, // 24 tháng gần nhất
    });
  }

  async createBillingRecord(data: {
    organizationId: string;
    plan: Plan;
    billingCycle: BillingCycle;
    amount: number;
    status: PaymentStatus;
    description?: string;
    paidAt?: Date;
  }) {
    return this.prisma.billingHistory.create({ data });
  }

  async updateOrganizationPlan(organizationId: string, plan: Plan) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { plan },
    });
  }

  // Lấy usage stats để hiển thị giới hạn plan
  async getUsageStats(organizationId: string) {
    const [contacts, deals, users, workflows, campaigns] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.deal.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.user.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.workflowAutomation.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.emailCampaign.count({ where: { organizationId, deletedAt: null } }),
    ]);
    return { contacts, deals, users, workflows, campaigns };
  }
}
