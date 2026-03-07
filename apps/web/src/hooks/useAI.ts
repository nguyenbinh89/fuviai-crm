'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// =====================
// TYPES
// =====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LeadScoreResult {
  score: number;
  label: 'Hot' | 'Warm' | 'Cold';
  reasoning: string;
  suggestions: string[];
}

export interface EmailDraftResult {
  subject: string;
  body: string;
}

export interface EmailWriterParams {
  purpose: string;
  contactName: string;
  contactCompany?: string;
  contactPosition?: string;
  dealTitle?: string;
  additionalContext?: string;
  tone: 'formal' | 'friendly' | 'urgent';
}

// =====================
// FUVIBOT CHAT
// =====================

export function useFuviBotChat() {
  return useMutation({
    mutationFn: async (messages: ChatMessage[]) => {
      const { data } = await api.post('/ai/chat', { messages });
      return data.data as { reply: string };
    },
  });
}

// =====================
// LEAD SCORING
// =====================

export function useScoreContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data } = await api.post(`/ai/contacts/${contactId}/score`);
      return data.data as LeadScoreResult;
    },
    onSuccess: () => {
      // Invalidate contact queries để refresh aiScore
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// =====================
// EMAIL WRITER
// =====================

export function useEmailWriter() {
  return useMutation({
    mutationFn: async (params: EmailWriterParams) => {
      const { data } = await api.post('/ai/email-writer', params);
      return data.data as EmailDraftResult;
    },
  });
}
