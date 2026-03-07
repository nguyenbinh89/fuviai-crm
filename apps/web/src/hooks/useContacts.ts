'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type ContactStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'INACTIVE';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ContactTag {
  tag: Tag;
}

export interface Contact {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  address: string | null;
  website: string | null;
  status: ContactStatus;
  aiScore: number | null;
  customFields: Record<string, unknown>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  tags: ContactTag[];
}

export interface ContactsResponse {
  data: Contact[];
  meta: { total: number; page: number; limit: number };
}

export interface ContactStats {
  LEAD: number;
  PROSPECT: number;
  CUSTOMER: number;
  INACTIVE: number;
}

export interface ContactFiltersParams {
  search?: string;
  status?: ContactStatus;
  tagIds?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'aiScore';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  website?: string;
  status?: ContactStatus;
  notes?: string;
  tagIds?: string[];
}

// =====================
// HOOKS
// =====================

export function useContacts(params: ContactFiltersParams = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ['contacts', params],
    queryFn: async () => {
      // Chuyển params thành query string, bỏ qua giá trị undefined
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.tagIds?.length) {
        params.tagIds.forEach((id) => searchParams.append('tagIds', id));
      }
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const res = await api.get(`/contacts?${searchParams.toString()}`);
      return res.data;
    },
  });
}

export function useContact(id: string) {
  return useQuery<{ data: Contact }>({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await api.get(`/contacts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useContactStats() {
  return useQuery<{ data: ContactStats }>({
    queryKey: ['contacts', 'stats'],
    queryFn: async () => {
      const res = await api.get('/contacts/stats');
      return res.data;
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateContactInput) => {
      const res = await api.post('/contacts', data);
      return res.data.data as Contact;
    },
    onSuccess: () => {
      // Invalidate danh sách và stats sau khi tạo mới
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateContactInput> }) => {
      const res = await api.patch(`/contacts/${id}`, data);
      return res.data.data as Contact;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as { created: number; skipped: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useTags() {
  return useQuery<{ data: Array<Tag & { _count: { contacts: number } }> }>({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get('/tags');
      return res.data;
    },
  });
}
