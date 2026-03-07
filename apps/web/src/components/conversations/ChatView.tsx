'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useConversation, useSendMessage, useCloseConversation, useReopenConversation } from '@/hooks/useConversations';
import { MessageBubble } from './MessageBubble';
import { ChannelBadge } from './ChannelBadge';
import Link from 'next/link';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { data: conversation, isLoading } = useConversation(conversationId);
  const { mutate: sendMsg, isPending: sending } = useSendMessage(conversationId);
  const { mutate: close, isPending: closing } = useCloseConversation();
  const { mutate: reopen, isPending: reopening } = useReopenConversation();

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput('');
    sendMsg({ content });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Đang tải...
      </div>
    );
  }

  if (!conversation) return null;

  const contact = conversation.contact;
  const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');

  // Group messages theo ngày
  const messages = conversation.messages ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {contact.firstName[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/contacts/${contact.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600"
              >
                {contactName}
              </Link>
              <ChannelBadge channel={conversation.channel} showLabel />
            </div>
            {contact.phone && (
              <p className="text-xs text-gray-500">{contact.phone}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {conversation.assignedTo && (
            <span className="text-xs text-gray-400">
              🙋 {conversation.assignedTo.firstName}
            </span>
          )}
          {conversation.isOpen ? (
            <button
              onClick={() => close(conversationId)}
              disabled={closing}
              className="text-xs text-gray-600 border border-gray-300 px-2.5 py-1 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ✓ Đóng
            </button>
          ) : (
            <button
              onClick={() => reopen(conversationId)}
              disabled={reopening}
              className="text-xs text-blue-600 border border-blue-300 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              ↩ Mở lại
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDate =
                !prev ||
                new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                        {format(new Date(msg.createdAt), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={msg} />
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {conversation.isOpen ? (
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              disabled={sending}
              className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-60"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {sending ? '...' : '➤'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 text-center">
          <p className="text-sm text-gray-500">
            Cuộc trò chuyện đã đóng.{' '}
            <button onClick={() => reopen(conversationId)} className="text-blue-600 hover:underline">
              Mở lại
            </button>{' '}
            để tiếp tục nhắn tin.
          </p>
        </div>
      )}
    </div>
  );
}
