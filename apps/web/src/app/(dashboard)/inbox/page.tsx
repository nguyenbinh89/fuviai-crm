'use client';

import { useState } from 'react';
import {
  useConversations,
  useInboxStats,
  useCreateConversation,
} from '@/hooks/useConversations';
import type { ConversationChannel } from '@/hooks/useConversations';
import { ConversationListItem } from '@/components/conversations/ConversationListItem';
import { ChatView } from '@/components/conversations/ChatView';

const CHANNEL_FILTERS: { label: string; value: ConversationChannel | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: '💬 Zalo', value: 'ZALO' },
  { label: '✉️ Email', value: 'EMAIL' },
  { label: '📱 SMS', value: 'SMS' },
];

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ConversationChannel | undefined>(undefined);
  const [isOpenFilter, setIsOpenFilter] = useState<boolean | undefined>(true); // Mặc định xem Open
  const [newConvOpen, setNewConvOpen] = useState(false);

  const { data: stats } = useInboxStats();
  const { data: convsData, isLoading } = useConversations({
    channel: channelFilter,
    isOpen: isOpenFilter,
  });

  const conversations = convsData?.data ?? [];
  const meta = convsData?.meta;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      {/* ===================== SIDEBAR ===================== */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">Hộp thư</h2>
            <button
              onClick={() => setNewConvOpen(true)}
              className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md hover:bg-blue-700"
            >
              + Tạo mới
            </button>
          </div>

          {/* Stats chips */}
          <div className="flex gap-2 text-xs">
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {stats?.unread ?? 0} chưa đọc
            </span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {stats?.open ?? 0} đang mở
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 py-2 border-b border-gray-100 space-y-2">
          {/* Channel filter */}
          <div className="flex flex-wrap gap-1">
            {CHANNEL_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setChannelFilter(f.value)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  channelFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Open/Closed toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsOpenFilter(true)}
              className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                isOpenFilter === true ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Đang mở
            </button>
            <button
              onClick={() => setIsOpenFilter(false)}
              className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                isOpenFilter === false ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Đã đóng
            </button>
            <button
              onClick={() => setIsOpenFilter(undefined)}
              className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                isOpenFilter === undefined ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-sm text-gray-500">Không có cuộc trò chuyện nào</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onClick={() => setSelectedId(conv.id)}
              />
            ))
          )}
        </div>

        {meta && meta.total > 30 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
            {meta.total} cuộc trò chuyện
          </div>
        )}
      </div>

      {/* ===================== MAIN CHAT AREA ===================== */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        {selectedId ? (
          <ChatView conversationId={selectedId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-5xl mb-4">💬</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Chọn cuộc trò chuyện
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
            </p>
          </div>
        )}
      </div>

      {/* Create conversation dialog */}
      {newConvOpen && (
        <CreateConversationDialog onClose={() => setNewConvOpen(false)} onCreated={setSelectedId} />
      )}
    </div>
  );
}

// =====================
// Create Conversation Dialog
// =====================

function CreateConversationDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState<ConversationChannel>('ZALO');
  const [zaloUserId, setZaloUserId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const { mutate: create, isPending } = useCreateConversation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;
    create(
      {
        contactId,
        channel,
        zaloUserId: zaloUserId || undefined,
        initialMessage: initialMessage || undefined,
      },
      {
        onSuccess: (conv) => {
          onCreated(conv.id);
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tạo cuộc trò chuyện</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Contact <span className="text-red-500">*</span>
            </label>
            <input
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="ID của contact"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kênh</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ConversationChannel)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ZALO">💬 Zalo OA</option>
              <option value="EMAIL">✉️ Email</option>
              <option value="SMS">📱 SMS</option>
              <option value="WEB">🌐 Web Chat</option>
            </select>
          </div>

          {channel === 'ZALO' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zalo User ID</label>
              <input
                value={zaloUserId}
                onChange={(e) => setZaloUserId(e.target.value)}
                placeholder="ID Zalo của khách hàng"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tin nhắn đầu tiên (tùy chọn)
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              placeholder="Nội dung tin nhắn đầu tiên..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={!contactId || isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Đang tạo...' : 'Tạo cuộc trò chuyện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
