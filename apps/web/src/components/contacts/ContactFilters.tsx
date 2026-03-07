'use client';

import { useEffect, useState } from 'react';
import { useContactsStore } from '@/store/contacts.store';
import { useTags } from '@/hooks/useContacts';
import type { ContactStatus } from '@/hooks/useContacts';

const STATUS_OPTIONS: Array<{ value: ContactStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

export function ContactFilters() {
  const { filters, setFilter } = useContactsStore();
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];

  // Debounce search input
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', searchInput || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleTagFilter = (tagId: string) => {
    const current = filters.tagIds ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setFilter('tagIds', next.length > 0 ? next : undefined);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Tìm tên, email, công ty..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => setFilter('status', (e.target.value as ContactStatus) || undefined)}
        className="px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const selected = filters.tagIds?.includes(tag.id) ?? false;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagFilter(tag.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                  selected
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={
                  selected
                    ? { backgroundColor: tag.color }
                    : { borderColor: tag.color + '60' }
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selected ? 'white' : tag.color }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
