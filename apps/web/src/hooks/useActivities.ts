'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
export type ActivityStatus = 'PENDING' | 'DONE' | 'CANCELLED';

export interface ActivityContact {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface ActivityDeal {
  id: string;
  title: string;
}

export interface ActivityUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  contactId: string | null;
  dealId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  contact: ActivityContact | null;
  deal: ActivityDeal | null;
  assignedTo: ActivityUser | null;
}

export interface Note {
  id: string;
  organizationId: string;
  content: string;
  contactId: string | null;
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityQuery {
  type?: ActivityType;
  status?: ActivityStatus;
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateActivityData {
  title: string;
  type: ActivityType;
  status?: ActivityStatus;
  description?: string;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
}

export interface CreateNoteData {
  content: string;
  contactId?: string;
  dealId?: string;
}

// =====================
// QUERY KEYS
// =====================

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (query: ActivityQuery) => [...activityKeys.lists(), query] as const,
  calendar: (dateFrom: string, dateTo: string) => [...activityKeys.all, 'calendar', dateFrom, dateTo] as const,
  upcoming: () => [...activityKeys.all, 'upcoming'] as const,
  detail: (id: string) => [...activityKeys.all, 'detail', id] as const,
};

export const noteKeys = {
  all: ['notes'] as const,
  list: (contactId?: string, dealId?: string) => [...noteKeys.all, { contactId, dealId }] as const,
};

// =====================
// ACTIVITY HOOKS
// =====================

export function useActivities(query: ActivityQuery = {}) {
  return useQuery({
    queryKey: activityKeys.list(query),
    queryFn: async () => {
      const { data } = await api.get('/activities', { params: query });
      return data as { data: Activity[]; meta: { total: number; page: number; limit: number } };
    },
  });
}

export function useActivityCalendar(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: activityKeys.calendar(dateFrom, dateTo),
    queryFn: async () => {
      const { data } = await api.get('/activities/calendar', { params: { dateFrom, dateTo } });
      return data.data as Activity[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useUpcomingActivities() {
  return useQuery({
    queryKey: activityKeys.upcoming(),
    queryFn: async () => {
      const { data } = await api.get('/activities/upcoming');
      return data.data as Activity[];
    },
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/activities/${id}`);
      return data.data as Activity;
    },
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateActivityData) => {
      const { data } = await api.post('/activities', dto);
      return data.data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateActivity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CreateActivityData>) => {
      const { data } = await api.patch(`/activities/${id}`, dto);
      return data.data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/activities/${id}/complete`);
      return data.data as Activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

// =====================
// NOTE HOOKS
// =====================

export function useNotes(contactId?: string, dealId?: string) {
  return useQuery({
    queryKey: noteKeys.list(contactId, dealId),
    queryFn: async () => {
      const { data } = await api.get('/notes', { params: { contactId, dealId } });
      return data.data as Note[];
    },
    enabled: !!(contactId || dealId),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateNoteData) => {
      const { data } = await api.post('/notes', dto);
      return data.data as Note;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(variables.contactId, variables.dealId) });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await api.patch(`/notes/${id}`, { content });
      return data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}
