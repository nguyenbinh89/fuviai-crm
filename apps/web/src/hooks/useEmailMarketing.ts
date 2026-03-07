'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';

export interface EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  body: string;
  previewText: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  body: string;
  previewText: string | null;
  status: CampaignStatus;
  templateId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  filterStatus: string | null;
  filterTagId: string | null;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string } | null;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  body: string;
  previewText?: string;
  isDefault?: boolean;
}

export interface CreateCampaignData {
  name: string;
  subject: string;
  body: string;
  previewText?: string;
  templateId?: string;
  scheduledAt?: string;
  filterStatus?: string;
  filterTagId?: string;
}

// =====================
// QUERY KEYS
// =====================

const templateKeys = {
  all: ['email-templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
};

const campaignKeys = {
  all: ['email-campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (page: number) => [...campaignKeys.lists(), page] as const,
  stats: () => [...campaignKeys.all, 'stats'] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

// =====================
// TEMPLATE HOOKS
// =====================

export function useEmailTemplates() {
  return useQuery({
    queryKey: templateKeys.lists(),
    queryFn: async () => {
      const { data } = await api.get('/email-marketing/templates');
      return data.data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/email-marketing/templates/${id}`);
      return data.data as EmailTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTemplateData) => {
      const { data } = await api.post('/email-marketing/templates', dto);
      return data.data as EmailTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CreateTemplateData>) => {
      const { data } = await api.patch(`/email-marketing/templates/${id}`, dto);
      return data.data as EmailTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/email-marketing/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

// =====================
// CAMPAIGN HOOKS
// =====================

export function useEmailCampaignStats() {
  return useQuery({
    queryKey: campaignKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/email-marketing/campaigns/stats');
      return data.data as {
        total: number;
        byStatus: { status: CampaignStatus; _count: number; _sum: { totalSent: number; totalRecipients: number } }[];
      };
    },
  });
}

export function useEmailCampaigns(page = 1) {
  return useQuery({
    queryKey: campaignKeys.list(page),
    queryFn: async () => {
      const { data } = await api.get('/email-marketing/campaigns', { params: { page, limit: 20 } });
      return data as { data: EmailCampaign[]; meta: { total: number; page: number; limit: number } };
    },
  });
}

export function useEmailCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/email-marketing/campaigns/${id}`);
      return data.data as EmailCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateCampaignData) => {
      const { data } = await api.post('/email-marketing/campaigns', dto);
      return data.data as EmailCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CreateCampaignData>) => {
      const { data } = await api.patch(`/email-marketing/campaigns/${id}`, dto);
      return data.data as EmailCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/email-marketing/campaigns/${id}/send`);
      return data.data as EmailCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/email-marketing/campaigns/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.all }),
  });
}
