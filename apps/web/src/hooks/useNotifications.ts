import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, string>;
  createdAt: string;
}

// Lấy danh sách thông báo
export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications', { params: { page, limit } });
      return data as { data: Notification[]; meta: { total: number; page: number; limit: number } };
    },
    staleTime: 30_000,
  });
}

// Số thông báo chưa đọc
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications/unread-count');
      return (data as { data: { count: number } }).data.count;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// Đánh dấu 1 thông báo đã đọc
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Đánh dấu tất cả đã đọc
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
