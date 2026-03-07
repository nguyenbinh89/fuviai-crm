'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface TeamStats {
  total: number;
  byRole: Partial<Record<UserRole, number>>;
  byStatus: Partial<Record<UserStatus, number>>;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { firstName: string; lastName: string };
}

// =====================
// HOOKS — MEMBERS
// =====================

export function useTeamStats() {
  return useQuery<TeamStats>({
    queryKey: ['team', 'stats'],
    queryFn: async () => {
      const res = await api.get('/team/stats');
      return res.data.data;
    },
  });
}

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const res = await api.get('/team/members');
      return res.data.data;
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const res = await api.patch(`/team/members/${id}/role`, { role });
      return res.data.data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserStatus }) => {
      const res = await api.patch(`/team/members/${id}/status`, { status });
      return res.data.data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

// =====================
// HOOKS — INVITATIONS
// =====================

export function usePendingInvitations() {
  return useQuery<PendingInvitation[]>({
    queryKey: ['team', 'invitations'],
    queryFn: async () => {
      const res = await api.get('/team/invitations');
      return res.data.data;
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: UserRole }) => {
      const res = await api.post('/team/invitations', data);
      return res.data.data as { email: string; role: string; acceptUrl: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'invitations'] });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/invitations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', 'invitations'] });
    },
  });
}
