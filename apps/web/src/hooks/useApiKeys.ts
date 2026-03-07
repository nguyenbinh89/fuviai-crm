import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: { firstName: string; lastName: string | null } | null;
}

export interface CreatedApiKey extends ApiKey {
  rawKey: string; // chỉ có lần đầu tạo
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api-keys');
      return (data as { data: ApiKey[] }).data;
    },
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; scopes?: string[]; expiresInDays?: number }) => {
      const { data } = await apiClient.post('/api-keys', dto);
      return (data as { data: CreatedApiKey }).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}
