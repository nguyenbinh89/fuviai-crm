'use client';

import {
  useDashboardOverview,
  useRevenueChart,
  usePipelineFunnel,
  useActivitySummary,
  useTopDeals,
  useRecentActivity,
  useConversionStats,
} from '@/hooks/useDashboard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel';
import { ActivitySummaryChart } from '@/components/dashboard/ActivitySummaryChart';
import { TopDealsWidget } from '@/components/dashboard/TopDealsWidget';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { ConversionStatsWidget } from '@/components/dashboard/ConversionStats';

// Format số tiền
function fmtRevenue(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ₫`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M ₫`;
  return `${value.toLocaleString('vi-VN')} ₫`;
}

function SkeletonCard() {
  return <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />;
}

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useDashboardOverview();
  const { data: revenueChart = [], isLoading: loadingRevenue } = useRevenueChart();
  const { data: funnel = [], isLoading: loadingFunnel } = usePipelineFunnel();
  const { data: activitySummary = [], isLoading: loadingActivity } = useActivitySummary();
  const { data: topDeals = [], isLoading: loadingTopDeals } = useTopDeals();
  const { data: recentActivity = [], isLoading: loadingRecent } = useRecentActivity();
  const { data: conversion, isLoading: loadingConversion } = useConversionStats();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingOverview ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : overview ? (
          <>
            <KpiCard
              label="Contacts"
              value={overview.contacts.total.toLocaleString('vi-VN')}
              icon="👥"
              growth={overview.contacts.growth}
              sub={`+${overview.contacts.thisMonth} tháng này`}
              color="blue"
            />
            <KpiCard
              label="Deals"
              value={overview.deals.total.toLocaleString('vi-VN')}
              icon="💼"
              growth={overview.deals.growth}
              sub={`${overview.deals.wonThisMonth} thắng tháng này`}
              color="purple"
            />
            <KpiCard
              label="Doanh thu"
              value={fmtRevenue(overview.revenue.thisMonth)}
              icon="💰"
              growth={overview.revenue.growth}
              sub="Tháng này"
              color="green"
            />
            <KpiCard
              label="Hội thoại"
              value={overview.conversations.open}
              icon="💬"
              sub="Đang mở"
              color="orange"
            />
            <KpiCard
              label="Activities"
              value={overview.activities.pending}
              icon="📋"
              sub="Chờ thực hiện"
              color="orange"
            />
            <KpiCard
              label="Workflows"
              value={overview.workflows.active}
              icon="⚡"
              sub="Đang hoạt động"
              color="gray"
            />
          </>
        ) : null}
      </div>

      {/* Revenue chart — full width */}
      {loadingRevenue ? (
        <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <RevenueChart data={revenueChart} />
      )}

      {/* Row: Pipeline Funnel + Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingFunnel ? (
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <PipelineFunnel data={funnel} />
        )}

        {loadingActivity ? (
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <ActivitySummaryChart data={activitySummary} />
        )}
      </div>

      {/* Row: Top Deals + Conversion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingTopDeals ? (
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <TopDealsWidget deals={topDeals} />
        )}

        {loadingConversion || !conversion ? (
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <ConversionStatsWidget data={conversion} />
        )}
      </div>

      {/* Recent Activity — full width */}
      {loadingRecent ? (
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <RecentActivityWidget activities={recentActivity} />
      )}
    </div>
  );
}
