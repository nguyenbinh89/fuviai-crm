import { create } from 'zustand';
import type { ChatMessage } from '@/hooks/useAI';

interface FuviBotStore {
  isOpen: boolean;
  messages: ChatMessage[];

  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
}

// Tin nhắn chào mừng mặc định
const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Xin chào! Tôi là FuviBot 👋\nTôi có thể giúp bạn phân tích khách hàng, gợi ý chiến lược bán hàng, hoặc soạn email. Hỏi tôi bất cứ điều gì!',
};

export const useFuviBotStore = create<FuviBotStore>((set) => ({
  isOpen: false,
  messages: [WELCOME_MESSAGE],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  clearHistory: () => set({ messages: [WELCOME_MESSAGE] }),
}));
