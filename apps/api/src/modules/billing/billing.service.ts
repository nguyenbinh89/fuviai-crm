import { Injectable, BadRequestException } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { Plan, BillingCycle } from '@prisma/client';
import type { ChangePlanDto } from './dto/change-plan.dto';

// =====================
// Định nghĩa các gói plan
// =====================
export const PLANS: Record<Plan, {
  name: string;
  description: string;
  priceMonthly: number; // VND
  priceYearly: number;  // VND (tính theo tháng, giảm ~17%)
  limits: {
    contacts: number;   // -1 = unlimited
    deals: number;
    users: number;
    workflows: number;
    campaigns: number;
    aiCredits: number;  // messages/month
  };
  features: string[];
}> = {
  STARTER: {
    name: 'Starter',
    description: 'Dành cho cá nhân và nhóm nhỏ',
    priceMonthly: 0,
    priceYearly: 0,
    limits: { contacts: 500, deals: 100, users: 2, workflows: 3, campaigns: 2, aiCredits: 50 },
    features: ['500 contacts', '2 người dùng', '3 workflows', 'FuviBot cơ bản'],
  },
  PRO: {
    name: 'Pro',
    description: 'Dành cho doanh nghiệp đang phát triển',
    priceMonthly: 990_000,
    priceYearly: 825_000,
    limits: { contacts: 10_000, deals: 2_000, users: 10, workflows: 20, campaigns: 20, aiCredits: 500 },
    features: ['10,000 contacts', '10 người dùng', '20 workflows', 'Email Marketing', 'FuviBot Pro', 'Zalo OA'],
  },
  BUSINESS: {
    name: 'Business',
    description: 'Dành cho doanh nghiệp lớn hơn',
    priceMonthly: 2_490_000,
    priceYearly: 2_075_000,
    limits: { contacts: 50_000, deals: 10_000, users: 30, workflows: 100, campaigns: 100, aiCredits: 2_000 },
    features: ['50,000 contacts', '30 người dùng', 'Workflows không giới hạn', 'API Access', 'Priority support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Giải pháp tùy chỉnh cho tập đoàn',
    priceMonthly: 0, // Liên hệ
    priceYearly: 0,
    limits: { contacts: -1, deals: -1, users: -1, workflows: -1, campaigns: -1, aiCredits: -1 },
    features: ['Không giới hạn', 'Custom workflows', 'Dedicated support', 'SLA 99.9%', 'On-premise option'],
  },
};

@Injectable()
export class BillingService {
  constructor(private readonly repo: BillingRepository) {}

  // Lấy thông tin subscription hiện tại + usage
  async getCurrentPlan(organizationId: string) {
    const [subscription, usage] = await Promise.all([
      this.repo.getSubscription(organizationId),
      this.repo.getUsageStats(organizationId),
    ]);

    const plan = subscription?.plan ?? 'STARTER';
    const planDef = PLANS[plan];

    return {
      subscription: subscription ?? {
        plan: 'STARTER',
        status: 'TRIALING',
        billingCycle: 'MONTHLY',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 ngày trial
      },
      planDefinition: planDef,
      usage,
      limits: planDef.limits,
    };
  }

  // Danh sách tất cả plans
  getPlans() {
    return Object.entries(PLANS).map(([key, val]) => ({
      plan: key as Plan,
      ...val,
    }));
  }

  // Nâng/hạ gói
  async changePlan(organizationId: string, dto: ChangePlanDto) {
    if (dto.plan === 'ENTERPRISE') {
      throw new BadRequestException('Vui lòng liên hệ sales@fuviai.com để đăng ký gói Enterprise');
    }

    const planDef = PLANS[dto.plan];
    const now = new Date();

    // Tính ngày kết thúc kỳ billing
    const periodEnd = new Date(now);
    if (dto.billingCycle === 'YEARLY') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const amount =
      dto.billingCycle === 'YEARLY'
        ? planDef.priceYearly * 12
        : planDef.priceMonthly;

    // Simulate payment (production: tích hợp Stripe / VNPay)
    const subscription = await this.repo.upsertSubscription({
      organizationId,
      plan: dto.plan,
      status: 'ACTIVE',
      billingCycle: dto.billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      priceMonthly: planDef.priceMonthly,
      priceYearly: planDef.priceYearly,
    });

    // Cập nhật plan trên Organization
    await this.repo.updateOrganizationPlan(organizationId, dto.plan);

    // Ghi billing record
    if (amount > 0) {
      await this.repo.createBillingRecord({
        organizationId,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        amount,
        status: 'PAID',
        description: `Nâng cấp lên ${planDef.name} (${dto.billingCycle === 'YEARLY' ? 'Năm' : 'Tháng'})`,
        paidAt: now,
      });
    }

    return { data: { subscription, plan: dto.plan, amount } };
  }

  // Hủy subscription
  async cancelSubscription(organizationId: string, reason?: string) {
    const sub = await this.repo.getSubscription(organizationId);
    if (!sub) throw new BadRequestException('Không có subscription đang hoạt động');
    if (sub.status === 'CANCELLED') throw new BadRequestException('Subscription đã được hủy');

    const updated = await this.repo.cancelSubscription(organizationId, reason);
    return { data: updated };
  }

  // Lịch sử thanh toán
  async getBillingHistory(organizationId: string) {
    const history = await this.repo.getBillingHistory(organizationId);
    return { data: history };
  }

  // Usage stats riêng
  async getUsage(organizationId: string) {
    const sub = await this.repo.getSubscription(organizationId);
    const plan = sub?.plan ?? 'STARTER';
    const [usage] = await Promise.all([this.repo.getUsageStats(organizationId)]);
    return { data: { plan, limits: PLANS[plan].limits, usage } };
  }
}
