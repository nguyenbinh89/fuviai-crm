'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications(1, 15);
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  // Click outside để đóng panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Thông báo"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Thông báo {unreadCount > 0 && <span className="text-blue-600">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={markingAll}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">Đang tải...</div>
            ) : !data?.data.length ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">Chưa có thông báo nào</p>
              </div>
            ) : (
              data.data.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markRead(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {(data?.meta.total ?? 0) > 15 && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <a href="/notifications" className="text-xs text-blue-600 hover:underline">
                Xem tất cả thông báo →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
