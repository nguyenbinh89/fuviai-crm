'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  usePlans,
  useCurrentPlan,
  useBillingHistory,
  useChangePlan,
  useCancelSubscription,
} from '@/hooks/useBilling';
import type { Plan, BillingCycle } from '@/hooks/useBilling';
import { PlanCard } from '@/components/billing/PlanCard';
import { UsageBar } from '@/components/billing/UsageBar';
import { BillingHistoryTable } from '@/components/billing/BillingHistoryTable';

const STATUS_LABEL: Record<string, string> = {
  TRIALING:  '🎁 Đang dùng thử',
  ACTIVE:    '✅ Đang hoạt động',
  PAST_DUE:  '⚠️ Quá hạn thanh toán',
  CANCELLED: '❌ Đã hủy',
  EXPIRED:   '⏰ Hết hạn',
};

export default function BillingPage() {
  const [tab, setTab] = useState<'plans' | 'usage' | 'history'>('plans');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: current, isLoading: loadingCurrent } = useCurrentPlan();
  const { data: history = [], isLoading: loadingHistory } = useBillingHistory();

  const { mutate: changePlan, isPending: changing } = useChangePlan();
  const { mutate: cancelSub, isPending: cancelling } = useCancelSubscription();

  const handleSelectPlan = (plan: Plan) => {
    if (!confirm(`Bạn có chắc muốn chuyển sang gói ${plan} (${billingCycle === 'YEARLY' ? 'thanh toán năm' : 'thanh toán tháng'})?`)) return;
    changePlan({ plan, billingCycle });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý gói đăng ký và lịch sử thanh toán</p>
        </div>
      </div>

      {/* Current plan summary */}
      {!loadingCurrent && current && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-base font-semibold text-gray-900">
                  Gói {current.subscription.plan}
                </h2>
                <span className="text-sm text-gray-500">
                  {STATUS_LABEL[current.subscription.status] ?? current.subscription.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Kỳ thanh toán hiện tại kết thúc:{' '}
                <strong>
                  {format(new Date(current.subscription.currentPeriodEnd), 'dd/MM/yyyy', { locale: vi })}
                </strong>
              </p>
              {current.subscription.trialEndsAt && (
                <p className="text-xs text-orange-500 mt-0.5">
                  Hết trial: {format(new Date(current.subscription.trialEndsAt), 'dd/MM/yyyy', { locale: vi })}
                </p>
              )}
            </div>

            {current.subscription.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-red-500 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Hủy subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['plans', 'usage', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'plans' ? 'Gói dịch vụ' : t === 'usage' ? 'Sử dụng' : 'Lịch sử thanh toán'}
          </button>
        ))}
      </div>

      {/* Plans tab */}
      {tab === 'plans' && (
        <div className="space-y-4">
          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${billingCycle === 'MONTHLY' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              Theo tháng
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                billingCycle === 'YEARLY' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                billingCycle === 'YEARLY' ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
            <span className={`text-sm ${billingCycle === 'YEARLY' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              Theo năm
              <span className="ml-1.5 text-xs text-green-600 font-medium">Tiết kiệm ~17%</span>
            </span>
          </div>

          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.plan}
                  plan={plan}
                  currentPlan={current?.subscription.plan ?? 'STARTER'}
                  billingCycle={billingCycle}
                  onSelect={handleSelectPlan}
                  isPending={changing}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Usage tab */}
      {tab === 'usage' && current && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Sử dụng tháng này</h3>
          <UsageBar label="Contacts" used={current.usage.contacts} limit={current.limits.contacts} icon="👥" />
          <UsageBar label="Deals" used={current.usage.deals} limit={current.limits.deals} icon="💼" />
          <UsageBar label="Người dùng" used={current.usage.users} limit={current.limits.users} icon="👤" />
          <UsageBar label="Workflows" used={current.usage.workflows} limit={current.limits.workflows} icon="⚡" />
          <UsageBar label="Email Campaigns" used={current.usage.campaigns} limit={current.limits.campaigns} icon="📧" />
          <UsageBar label="AI Credits" used={0} limit={current.limits.aiCredits} icon="🤖" />

          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Cần thêm dung lượng?{' '}
            <button onClick={() => setTab('plans')} className="text-blue-600 hover:underline">
              Nâng cấp gói ngay →
            </button>
          </p>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingHistory ? (
            <div className="p-8 text-center text-gray-400">Đang tải...</div>
          ) : (
            <BillingHistoryTable records={history} />
          )}
        </div>
      )}

      {/* Cancel confirm dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <p className="text-3xl mb-3">😢</p>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Hủy subscription?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tài khoản sẽ được giữ nguyên đến hết kỳ thanh toán hiện tại, sau đó chuyển về gói Starter.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Giữ lại
              </button>
              <button
                onClick={() => {
                  cancelSub(undefined, { onSuccess: () => setShowCancelConfirm(false) });
                }}
                disabled={cancelling}
                className="flex-1 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
