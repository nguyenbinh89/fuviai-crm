import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  organization: { id: string; name: string; plan: string; logoUrl: string | null };
}

export interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  locale: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/profile/me');
      return (data as { data: UserProfile }).data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
      apiClient.patch('/profile/me', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/profile/me/change-password', dto),
  });
}

export function useOrgSettings() {
  return useQuery({
    queryKey: ['profile', 'org-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/profile/org-settings');
      return (data as { data: OrgSettings }).data;
    },
    staleTime: 120_000,
  });
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<OrgSettings>) =>
      apiClient.patch('/profile/org-settings', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'org-settings'] });
    },
  });
}
