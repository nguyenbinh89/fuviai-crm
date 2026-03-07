'use client';

import { useDealsStore } from '@/store/deals.store';
import type { KanbanStage } from '@/hooks/useDeals';

interface DealFiltersProps {
  stages?: KanbanStage[];
}

export function DealFilters({ stages = [] }: DealFiltersProps) {
  const { filters, setFilter, resetFilters } = useDealsStore();

  const hasActiveFilters = !!(filters.search || filters.status || filters.stageId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        value={filters.search ?? ''}
        onChange={(e) => setFilter('search', e.target.value || undefined)}
        placeholder="Tìm kiếm deal..."
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
      />

      {/* Status filter */}
      <select
        value={filters.status ?? ''}
        onChange={(e) =>
          setFilter('status', (e.target.value as 'OPEN' | 'WON' | 'LOST') || undefined)
        }
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="OPEN">Đang mở</option>
        <option value="WON">Thành công</option>
        <option value="LOST">Thất bại</option>
      </select>

      {/* Stage filter */}
      {stages.length > 0 && (
        <select
          value={filters.stageId ?? ''}
          onChange={(e) => setFilter('stageId', e.target.value || undefined)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả stages</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
