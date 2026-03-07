'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type TriggerType =
  | 'CONTACT_CREATED'
  | 'CONTACT_STATUS_CHANGED'
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'CONVERSATION_RECEIVED'
  | 'ACTIVITY_DUE'
  | 'MANUAL';

export type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_ZALO'
  | 'CREATE_ACTIVITY'
  | 'UPDATE_CONTACT_STATUS'
  | 'UPDATE_DEAL_STAGE'
  | 'ASSIGN_TO_USER'
  | 'ADD_TAG'
  | 'SEND_WEBHOOK'
  | 'WAIT';

export type WorkflowStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type WorkflowRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WorkflowAction {
  type: ActionType;
  order: number;
  config: Record<string, any>;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  triggerData: Record<string, any>;
  actionResults: any[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  triggerConditions: Record<string, any>;
  actions: WorkflowAction[];
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { runs: number };
  runs?: WorkflowRun[];
}

export interface AutomationStats {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  runsToday: number;
}

// =====================
// HOOKS
// =====================

export function useAutomationStats() {
  return useQuery<AutomationStats>({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const res = await api.get('/automations/stats');
      return res.data.data;
    },
  });
}

export function useAutomations(params?: {
  status?: WorkflowStatus;
  triggerType?: TriggerType;
  search?: string;
}) {
  return useQuery<{ data: Workflow[]; meta: { total: number } }>({
    queryKey: ['automations', params],
    queryFn: async () => {
      const res = await api.get('/automations', { params });
      return res.data;
    },
  });
}

export function useAutomation(id: string | null) {
  return useQuery<Workflow>({
    queryKey: ['automations', id],
    queryFn: async () => {
      const res = await api.get(`/automations/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      triggerType: TriggerType;
      triggerConditions?: Record<string, any>;
      actions: WorkflowAction[];
    }) => {
      const res = await api.post('/automations', data);
      return res.data.data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<{
      name: string;
      description: string;
      triggerType: TriggerType;
      triggerConditions: Record<string, any>;
      actions: WorkflowAction[];
      status: WorkflowStatus;
    }>) => {
      const res = await api.patch(`/automations/${id}`, data);
      return res.data.data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/automations/${id}/activate`);
      return res.data.data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useDeactivateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/automations/${id}/deactivate`);
      return res.data.data as Workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useTriggerWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, context }: { id: string; context?: Record<string, any> }) => {
      const res = await api.post(`/automations/${id}/trigger`, { context });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useWorkflowRuns(workflowId: string | null) {
  return useQuery<WorkflowRun[]>({
    queryKey: ['workflow-runs', workflowId],
    queryFn: async () => {
      const res = await api.get(`/automations/${workflowId}/runs`);
      return res.data.data;
    },
    enabled: !!workflowId,
  });
}
