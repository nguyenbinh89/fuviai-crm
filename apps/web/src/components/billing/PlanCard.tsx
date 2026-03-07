'use client';

import type { PlanDefinition, Plan, BillingCycle } from '@/hooks/useBilling';

interface PlanCardProps {
  plan: PlanDefinition;
  currentPlan: Plan;
  billingCycle: BillingCycle;
  onSelect: (plan: Plan) => void;
  isPending: boolean;
}

const PLAN_COLORS: Record<Plan, string> = {
  STARTER:    'border-gray-200',
  PRO:        'border-blue-400',
  BUSINESS:   'border-purple-400',
  ENTERPRISE: 'border-orange-400',
};

const PLAN_BADGE: Record<Plan, string | null> = {
  STARTER:    null,
  PRO:        'Phổ biến nhất',
  BUSINESS:   'Cho doanh nghiệp',
  ENTERPRISE: 'Liên hệ sales',
};

function fmtVND(amount: number): string {
  if (amount === 0) return 'Miễn phí';
  return `${(amount / 1_000).toFixed(0)}K ₫`;
}

export function PlanCard({ plan, currentPlan, billingCycle, onSelect, isPending }: PlanCardProps) {
  const isCurrent = plan.plan === currentPlan;
  const price = billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
  const badge = PLAN_BADGE[plan.plan];
  const isEnterprise = plan.plan === 'ENTERPRISE';

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-5 flex flex-col ${PLAN_COLORS[plan.plan]} ${
        isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
    >
      {badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white ${
          plan.plan === 'PRO' ? 'bg-blue-500' : plan.plan === 'BUSINESS' ? 'bg-purple-500' : 'bg-orange-500'
        }`}>
          {badge}
        </span>
      )}

      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">{plan.description}</p>

      {/* Price */}
      <div className="mb-4">
        {isEnterprise ? (
          <p className="text-2xl font-bold text-gray-900">Liên hệ</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900">{fmtVND(price)}</p>
            {price > 0 && (
              <p className="text-xs text-gray-400">/ tháng{billingCycle === 'YEARLY' ? ' (thanh toán năm)' : ''}</p>
            )}
          </>
        )}
        {billingCycle === 'YEARLY' && plan.priceMonthly > 0 && (
          <p className="text-xs text-green-600 mt-0.5">
            Tiết kiệm {Math.round((1 - plan.priceYearly / plan.priceMonthly) * 100)}% so với theo tháng
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5 flex-1 mb-5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-green-500 shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* Action button */}
      {isCurrent ? (
        <div className="w-full py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
          Gói hiện tại ✓
        </div>
      ) : isEnterprise ? (
        <a
          href="mailto:sales@fuviai.com"
          className="w-full py-2 text-center text-sm font-medium text-orange-600 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 block"
        >
          Liên hệ Sales →
        </a>
      ) : (
        <button
          onClick={() => onSelect(plan.plan)}
          disabled={isPending}
          className={`w-full py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
            plan.plan === 'PRO'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : plan.plan === 'BUSINESS'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-800 text-white hover:bg-gray-900'
          }`}
        >
          {isPending ? 'Đang xử lý...' : 'Chọn gói này'}
        </button>
      )}
    </div>
  );
}
