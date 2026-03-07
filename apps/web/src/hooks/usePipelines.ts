'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

export interface Pipeline {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  stages: PipelineStage[];
  _count?: { stages: number; deals: number };
}

export interface CreatePipelineInput {
  name: string;
  description?: string;
  isDefault?: boolean;
  stages?: Array<{ name: string; order: number; color?: string; probability?: number }>;
}

// =====================
// HOOKS
// =====================

export function usePipelines() {
  return useQuery<{ data: Pipeline[] }>({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const res = await api.get('/pipelines');
      return res.data;
    },
  });
}

export function usePipeline(id: string | null) {
  return useQuery<{ data: Pipeline }>({
    queryKey: ['pipelines', id],
    queryFn: async () => {
      const res = await api.get(`/pipelines/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePipelineInput) => {
      const res = await api.post('/pipelines', data);
      return res.data.data as Pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useAddStage(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      order: number;
      color?: string;
      probability?: number;
    }) => {
      const res = await api.post(`/pipelines/${pipelineId}/stages`, data);
      return res.data.data as PipelineStage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useReorderStages(pipelineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      const res = await api.patch(`/pipelines/${pipelineId}/stages/reorder`, { orders });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId] });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pipelines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}
