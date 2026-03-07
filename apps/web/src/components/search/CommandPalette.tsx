'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch, type SearchResult } from '@/hooks/useSearch';

const TYPE_ICON: Record<string, string> = {
  contact:  '👤',
  deal:     '💼',
  activity: '📋',
};

const TYPE_LABEL: Record<string, string> = {
  contact:  'Contacts',
  deal:     'Deals',
  activity: 'Hoạt động',
};

function ResultGroup({ label, items, onSelect }: {
  label: string;
  items: SearchResult[];
  onSelect: (item: SearchResult) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
        >
          <span className="text-lg flex-shrink-0">{TYPE_ICON[item.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
            {item.subtitle && (
              <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
            )}
          </div>
          <span className="text-xs text-gray-300 flex-shrink-0">→</span>
        </button>
      ))}
    </div>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data, isLoading } = useSearch(query);

  const totalResults = (data?.contacts.length ?? 0) + (data?.deals.length ?? 0) + (data?.activities.length ?? 0);

  // Cmd+K / Ctrl+K để mở
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input khi mở
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const handleSelect = useCallback((item: SearchResult) => {
    router.push(item.url);
    setOpen(false);
  }, [router]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65a7.5 7.5 0 0012 0z" />
        </svg>
        <span>Tìm kiếm...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65a7.5 7.5 0 0012 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm contacts, deals, hoạt động..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          ) : totalResults === 0 && !isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Không tìm thấy kết quả cho <strong>"{query}"</strong>
            </div>
          ) : (
            <div className="pb-2">
              <ResultGroup
                label={TYPE_LABEL.contact}
                items={data?.contacts ?? []}
                onSelect={handleSelect}
              />
              <ResultGroup
                label={TYPE_LABEL.deal}
                items={data?.deals ?? []}
                onSelect={handleSelect}
              />
              <ResultGroup
                label={TYPE_LABEL.activity}
                items={data?.activities ?? []}
                onSelect={handleSelect}
              />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono">↵</kbd> Mở</span>
          <span><kbd className="font-mono">Esc</kbd> Đóng</span>
        </div>
      </div>
    </div>
  );
}
