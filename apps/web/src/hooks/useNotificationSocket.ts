'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationsStore } from '@/store/notifications.store';
import type { Notification } from './useNotifications';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

/**
 * Kết nối WebSocket đến NestJS notifications gateway.
 * Tự động invalidate query cache và hiển thị toast khi nhận notification mới.
 *
 * Dùng dynamic import socket.io-client để tránh SSR issues.
 */
export function useNotificationSocket(accessToken: string | null) {
  const qc = useQueryClient();
  const { addToast } = useNotificationsStore();

  useEffect(() => {
    if (!accessToken) return;

    let socket: any;

    // Lazy import để tránh SSR error
    import('socket.io-client').then(({ io }) => {
      socket = io(`${WS_URL}/notifications`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 3000,
      });

      socket.on('notification:new', (notification: Notification) => {
        // Cập nhật cache
        qc.invalidateQueries({ queryKey: ['notifications'] });

        // Hiển thị toast
        addToast({
          title: notification.title,
          body: notification.body,
          type: 'info',
        });
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, [accessToken]);
}
