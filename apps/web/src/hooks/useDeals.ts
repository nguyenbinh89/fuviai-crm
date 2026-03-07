'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type DealStatus = 'OPEN' | 'WON' | 'LOST';

export interface DealStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  order: number;
}

export interface DealContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
}

export interface DealUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Deal {
  id: string;
  organizationId: string;
  title: string;
  value: number | null;
  currency: string;
  status: DealStatus;
  pipelineId: string;
  stageId: string;
  contactId: string | null;
  assignedToId: string | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  notes: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  stage: DealStage;
  contact: DealContact | null;
  assignedTo: DealUser | null;
  // Chỉ có trong findById
  pipeline?: {
    id: string;
    name: string;
    stages: DealStage[];
  };
}

export interface KanbanStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  order: number;
  deals: Deal[];
}

export interface KanbanData {
  pipeline: { id: string; name: string };
  stages: KanbanStage[];
}

export interface DealStats {
  total: number;
  totalValue: number;
  winRate: number;
  byStatus: Record<DealStatus, { count: number; totalValue: number }>;
}

export interface DealsResponse {
  data: Deal[];
  meta: { total: number; page: number; limit: number };
}

export interface DealFiltersParams {
  pipelineId?: string;
  stageId?: string;
  status?: DealStatus;
  contactId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'value' | 'expectedCloseDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDealInput {
  title: string;
  value?: number;
  currency?: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  assignedToId?: string;
  expectedCloseDate?: string;
  notes?: string;
  status?: DealStatus;
}

// =====================
// HOOKS
// =====================

export function useDeals(params: DealFiltersParams = {}) {
  return useQuery<DealsResponse>({
    queryKey: ['deals', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.pipelineId) searchParams.set('pipelineId', params.pipelineId);
      if (params.stageId) searchParams.set('stageId', params.stageId);
      if (params.status) searchParams.set('status', params.status);
      if (params.contactId) searchParams.set('contactId', params.contactId);
      if (params.assignedToId) searchParams.set('assignedToId', params.assignedToId);
      if (params.search) searchParams.set('search', params.search);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const res = await api.get(`/deals?${searchParams.toString()}`);
      return res.data;
    },
  });
}

export function useDeal(id: string | null) {
  return useQuery<{ data: Deal }>({
    queryKey: ['deals', id],
    queryFn: async () => {
      const res = await api.get(`/deals/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useDealsKanban(pipelineId: string | null) {
  return useQuery<{ data: KanbanData }>({
    queryKey: ['deals', 'kanban', pipelineId],
    queryFn: async () => {
      const res = await api.get(`/deals/kanban?pipelineId=${pipelineId}`);
      return res.data;
    },
    enabled: !!pipelineId,
  });
}

export function useDealStats(pipelineId?: string) {
  return useQuery<{ data: DealStats }>({
    queryKey: ['deals', 'stats', pipelineId],
    queryFn: async () => {
      const url = pipelineId
        ? `/deals/stats?pipelineId=${pipelineId}`
        : '/deals/stats';
      const res = await api.get(url);
      return res.data;
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDealInput) => {
      const res = await api.post('/deals', data);
      return res.data.data as Deal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['deals', 'kanban', deal.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDealInput> }) => {
      const res = await api.patch(`/deals/${id}`, data);
      return res.data.data as Deal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', deal.id] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'kanban', deal.pipelineId] });
    },
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => {
      const res = await api.patch(`/deals/${id}/move`, { stageId });
      return res.data.data as Deal;
    },
    onSuccess: (deal) => {
      // Invalidate kanban để re-fetch dữ liệu mới
      queryClient.invalidateQueries({ queryKey: ['deals', 'kanban', deal.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'stats'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
