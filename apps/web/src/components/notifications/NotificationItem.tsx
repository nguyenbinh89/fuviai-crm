import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Notification } from '@/hooks/useNotifications';

const TYPE_ICON: Record<string, string> = {
  DEAL_WON:           '🎉',
  DEAL_LOST:          '😞',
  DEAL_STAGE_CHANGED: '🔄',
  NEW_MESSAGE:        '💬',
  ACTIVITY_DUE:       '⏰',
  ACTIVITY_ASSIGNED:  '📋',
  CONTACT_ASSIGNED:   '👤',
  WORKFLOW_FAILED:    '⚠️',
  TEAM_MEMBER_JOINED: '👋',
  BILLING_ALERT:      '💳',
  SYSTEM:             'ℹ️',
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const icon = TYPE_ICON[notification.type] ?? 'ℹ️';

  return (
    <button
      onClick={() => !notification.isRead && onRead(notification.id)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        notification.isRead ? 'opacity-60' : ''
      }`}
    >
      {/* Indicator chưa đọc */}
      <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 self-center" style={{ visibility: notification.isRead ? 'hidden' : 'visible' }} />
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'font-medium text-gray-900'} truncate`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
        </p>
      </div>
    </button>
  );
}
