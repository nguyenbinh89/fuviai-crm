import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  resourceLabel: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string | null; email: string } | null;
}

export interface AuditLogsQuery {
  userId?: string;
  resource?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useAuditLogs(query: AuditLogsQuery = {}) {
  return useQuery({
    queryKey: ['audit-logs', query],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== ''),
      );
      const { data } = await apiClient.get('/audit-logs', { params });
      return data as { data: AuditLog[]; meta: { total: number; page: number; limit: number } };
    },
    staleTime: 15_000,
  });
}

export function buildExportUrl(query: Omit<AuditLogsQuery, 'page' | 'limit'>): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1') + '/audit-logs/export';
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>,
  );
  return `${base}?${params.toString()}`;
}
