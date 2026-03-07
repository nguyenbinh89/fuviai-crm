'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Conversation } from '@/hooks/useConversations';
import { ChannelBadge } from './ChannelBadge';

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, isSelected, onClick }: ConversationListItemProps) {
  const contact = conversation.contact;
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  const initials = contact.firstName[0]?.toUpperCase() ?? '?';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0 relative">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {initials}
          </div>
          {/* Unread dot */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
              {contactName}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <ChannelBadge channel={conversation.channel} />
              {conversation.lastMessageAt && (
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false, locale: vi })}
                </span>
              )}
            </div>
          </div>

          <p className={`text-xs truncate ${hasUnread ? 'text-gray-700' : 'text-gray-400'}`}>
            {conversation.lastMessagePreview ?? 'Chưa có tin nhắn'}
          </p>

          {!conversation.isOpen && (
            <span className="text-xs text-gray-400 italic">✓ Đã đóng</span>
          )}
        </div>
      </div>
    </button>
  );
}
