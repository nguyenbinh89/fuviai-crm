import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Message } from '@/hooks/useConversations';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'OUTBOUND';
  const senderName = message.sender
    ? [message.sender.firstName, message.sender.lastName].filter(Boolean).join(' ')
    : null;

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-3`}>
      {/* Inbound: avatar */}
      {!isOutbound && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 mr-2 mt-auto mb-1">
          👤
        </div>
      )}

      <div className={`max-w-[70%] ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender name (inbound only, không phải khách) */}
        {isOutbound && senderName && (
          <span className="text-xs text-gray-400 mb-1 text-right">{senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOutbound
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
          }`}
        >
          {/* Image attachment */}
          {message.messageType === 'image' && message.attachmentUrl ? (
            <div>
              <img
                src={message.attachmentUrl}
                alt="Hình ảnh"
                className="rounded-lg max-w-full mb-1"
                style={{ maxHeight: '200px' }}
              />
              {message.content && message.content !== '[image]' && (
                <p className="mt-1">{message.content}</p>
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp + status */}
        <div className={`flex items-center gap-1.5 mt-0.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400">
            {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
          </span>
          {isOutbound && (
            <span className="text-xs text-gray-400">
              {message.status === 'READ' ? '✓✓' : message.status === 'DELIVERED' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
