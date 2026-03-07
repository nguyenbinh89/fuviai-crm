'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export interface DashboardOverview {
  contacts: { total: number; thisMonth: number; growth: number };
  deals: { total: number; wonThisMonth: number; growth: number };
  revenue: { thisMonth: number; lastMonth: number; growth: number };
  conversations: { open: number };
  activities: { pending: number };
  workflows: { active: number };
}

export interface RevenueChartPoint {
  label: string;
  revenue: number;
  deals: number;
}

export interface PipelineFunnelStage {
  stageName: string;
  stageColor: string;
  dealCount: number;
  totalValue: number;
}

export interface ActivitySummaryRow {
  type: string;
  PENDING: number;
  DONE: number;
  CANCELLED: number;
  total: number;
}

export interface TopDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contact: string;
  probability: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  subject: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  contact?: string;
  deal?: string;
  assignedTo?: string;
}

export interface ConversionStats {
  totalContacts: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  winRate: number;
  contactToDeal: number;
}

// =====================
// HOOKS
// =====================

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await api.get('/dashboard/overview');
      return res.data.data;
    },
    staleTime: 60_000, // 1 phút
  });
}

export function useRevenueChart() {
  return useQuery<RevenueChartPoint[]>({
    queryKey: ['dashboard', 'revenue-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/revenue-chart');
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function usePipelineFunnel(pipelineId?: string) {
  return useQuery<PipelineFunnelStage[]>({
    queryKey: ['dashboard', 'pipeline-funnel', pipelineId],
    queryFn: async () => {
      const res = await api.get('/dashboard/pipeline-funnel', {
        params: pipelineId ? { pipelineId } : undefined,
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useActivitySummary() {
  return useQuery<ActivitySummaryRow[]>({
    queryKey: ['dashboard', 'activity-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/activity-summary');
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useTopDeals() {
  return useQuery<TopDeal[]>({
    queryKey: ['dashboard', 'top-deals'],
    queryFn: async () => {
      const res = await api.get('/dashboard/top-deals');
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useRecentActivity() {
  return useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-activity');
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

export function useConversionStats() {
  return useQuery<ConversionStats>({
    queryKey: ['dashboard', 'conversion'],
    queryFn: async () => {
      const res = await api.get('/dashboard/conversion');
      return res.data.data;
    },
    staleTime: 60_000,
  });
}
