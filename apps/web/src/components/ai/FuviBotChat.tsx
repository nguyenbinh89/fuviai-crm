'use client';

import { useState, useRef, useEffect } from 'react';
import { useFuviBotStore } from '@/store/fuvibot.store';
import { useFuviBotChat } from '@/hooks/useAI';

export function FuviBotChat() {
  const { messages, addMessage, clearHistory } = useFuviBotStore();
  const { mutate: sendChat, isPending } = useFuviBotChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || isPending) return;

    // Thêm message của user vào store
    const userMessage = { role: 'user' as const, content };
    addMessage(userMessage);
    setInput('');

    // Gửi toàn bộ lịch sử (không kể welcome message của bot)
    const history = [...messages.filter((m) => m.role === 'user' || messages.indexOf(m) > 0), userMessage];

    sendChat(history, {
      onSuccess: (result) => {
        addMessage({ role: 'assistant', content: result.reply });
      },
      onError: () => {
        addMessage({
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-semibold">FuviBot</p>
            <p className="text-xs text-blue-200">AI Assistant</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-blue-200 hover:text-white transition-colors"
          title="Xóa lịch sử chat"
        >
          🗑️ Xóa
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <span className="shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2 mt-0.5">
                🤖
              </span>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isPending && (
          <div className="flex justify-start">
            <span className="shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
              🤖
            </span>
            <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-4 py-2 shadow-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Gợi ý câu hỏi nhanh */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-1.5">
        {['Gợi ý email chào hàng', 'Tips follow-up', 'Cách tăng tỷ lệ chốt deal'].map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="text-xs bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 py-3 bg-white border-t border-gray-200">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nhập câu hỏi... (Enter để gửi)"
          rows={1}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          style={{ maxHeight: '80px', overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isPending}
          className="shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors text-sm"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
