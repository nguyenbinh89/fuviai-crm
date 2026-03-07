'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export type ConversationChannel = 'ZALO' | 'EMAIL' | 'SMS' | 'WEB';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ConversationContact {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: string;
  messageType: string;
  attachmentUrl: string | null;
  senderId: string | null;
  createdAt: string;
  readAt: string | null;
  sender: MessageSender | null;
}

export interface Conversation {
  id: string;
  organizationId: string;
  contactId: string;
  channel: ConversationChannel;
  zaloUserId: string | null;
  isOpen: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  assignedToId: string | null;
  createdAt: string;
  contact: ConversationContact;
  assignedTo: ConversationUser | null;
  messages?: Message[];
}

export interface InboxStats {
  total: number;
  unread: number;
  open: number;
}

// =====================
// QUERY KEYS
// =====================

export const convKeys = {
  all: ['conversations'] as const,
  stats: () => [...convKeys.all, 'stats'] as const,
  lists: () => [...convKeys.all, 'list'] as const,
  list: (opts: object) => [...convKeys.lists(), opts] as const,
  detail: (id: string) => [...convKeys.all, 'detail', id] as const,
};

// =====================
// HOOKS
// =====================

export function useInboxStats() {
  return useQuery({
    queryKey: convKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/conversations/stats');
      return data.data as InboxStats;
    },
    refetchInterval: 30_000, // Tự refresh mỗi 30s
  });
}

export function useConversations(opts: {
  channel?: ConversationChannel;
  isOpen?: boolean;
  contactId?: string;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: convKeys.list(opts),
    queryFn: async () => {
      const { data } = await api.get('/conversations', { params: opts });
      return data as { data: Conversation[]; meta: { total: number; page: number; limit: number } };
    },
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: convKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${id}`);
      return data.data as Conversation;
    },
    enabled: !!id,
    refetchInterval: 10_000, // Poll mỗi 10s để lấy tin nhắn mới
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      contactId: string;
      channel: ConversationChannel;
      zaloUserId?: string;
      initialMessage?: string;
    }) => {
      const { data } = await api.post('/conversations', dto);
      return data.data as Conversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: convKeys.all }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { content: string; messageType?: string }) => {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, dto);
      return data.data as Message;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: convKeys.detail(conversationId) });
      qc.invalidateQueries({ queryKey: convKeys.lists() });
    },
  });
}

export function useCloseConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/conversations/${id}/close`);
      return data.data as Conversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: convKeys.all }),
  });
}

export function useReopenConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/conversations/${id}/reopen`);
      return data.data as Conversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: convKeys.all }),
  });
}
