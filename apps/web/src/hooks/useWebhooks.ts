import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export const WEBHOOK_EVENTS = [
  'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED',
  'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_WON', 'DEAL_LOST', 'DEAL_STAGE_CHANGED',
  'ACTIVITY_CREATED', 'ACTIVITY_COMPLETED',
  'CONVERSATION_MESSAGE_RECEIVED',
  'WORKFLOW_RUN_COMPLETED', 'WORKFLOW_RUN_FAILED',
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[number];

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  responseCode: number | null;
  durationMs: number | null;
  attempt: number;
  createdAt: string;
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/webhooks');
      return (data as { data: WebhookEndpoint[] }).data;
    },
    staleTime: 30_000,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; url: string; events: string[] }) => {
      const { data } = await apiClient.post('/webhooks', dto);
      return (data as { data: WebhookEndpoint & { secret: string } }).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string; isActive?: boolean; events?: string[] }) =>
      apiClient.patch(`/webhooks/${id}`, dto),

    // Optimistic update — toggle isActive ngay lập tức trước khi API trả về
    onMutate: async ({ id, isActive }) => {
      if (isActive === undefined) return;
      await qc.cancelQueries({ queryKey: ['webhooks'] });
      const prev = qc.getQueryData<WebhookEndpoint[]>(['webhooks']);
      qc.setQueryData<WebhookEndpoint[]>(['webhooks'], (old = []) =>
        old.map((ep) => (ep.id === id ? { ...ep, isActive } : ep)),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['webhooks'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useWebhookDeliveries(endpointId: string | null) {
  return useQuery({
    queryKey: ['webhooks', endpointId, 'deliveries'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/webhooks/${endpointId}/deliveries`);
      return (data as { data: WebhookDelivery[] }).data;
    },
    enabled: !!endpointId,
    staleTime: 15_000,
  });
}
