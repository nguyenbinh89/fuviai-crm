'use client';

import { useNotificationsStore } from '@/store/notifications.store';

const TYPE_STYLES = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error:   'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info:    'bg-blue-50 border-blue-400 text-blue-800',
};

const TYPE_ICON = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationsStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm animate-slide-up ${TYPE_STYLES[toast.type]}`}
        >
          <span className="text-base flex-shrink-0">{TYPE_ICON[toast.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{toast.title}</p>
            {toast.body && <p className="opacity-80 mt-0.5 line-clamp-2">{toast.body}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
