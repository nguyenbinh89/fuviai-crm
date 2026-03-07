import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationsState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Tự động remove sau 4 giây
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Helper: gọi ở bất kỳ đâu mà không cần hook */
export const toast = {
  success: (title: string, body?: string) =>
    useNotificationsStore.getState().addToast({ title, body: body ?? '', type: 'success' }),
  error: (title: string, body?: string) =>
    useNotificationsStore.getState().addToast({ title, body: body ?? '', type: 'error' }),
  info: (title: string, body?: string) =>
    useNotificationsStore.getState().addToast({ title, body: body ?? '', type: 'info' }),
  warning: (title: string, body?: string) =>
    useNotificationsStore.getState().addToast({ title, body: body ?? '', type: 'warning' }),
};
