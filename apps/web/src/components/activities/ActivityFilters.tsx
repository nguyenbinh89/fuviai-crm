'use client';

import type { ActivityType, ActivityStatus } from '@/hooks/useActivities';
import { useActivitiesStore } from '@/store/activities.store';

export function ActivityFilters() {
  const { filters, setFilter, resetFilters } = useActivitiesStore();

  const hasActiveFilters =
    !!filters.type || !!filters.status || !!filters.contactId || !!filters.dealId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Loại */}
      <select
        value={filters.type ?? ''}
        onChange={(e) => setFilter('type', (e.target.value as ActivityType) || undefined)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả loại</option>
        <option value="CALL">📞 Cuộc gọi</option>
        <option value="EMAIL">✉️ Email</option>
        <option value="MEETING">🤝 Họp</option>
        <option value="TASK">✅ Nhiệm vụ</option>
      </select>

      {/* Trạng thái */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => setFilter('status', (e.target.value as ActivityStatus) || undefined)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="PENDING">Chờ xử lý</option>
        <option value="DONE">Hoàn thành</option>
        <option value="CANCELLED">Đã hủy</option>
      </select>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
