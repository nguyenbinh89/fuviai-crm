'use client';

import { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitiesStore } from '@/store/activities.store';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { ActivityFilters } from '@/components/activities/ActivityFilters';
import { CalendarView } from '@/components/activities/CalendarView';
import { CreateActivityDialog } from '@/components/activities/CreateActivityDialog';
import { EditActivitySheet } from '@/components/activities/EditActivitySheet';
import { UpcomingActivities } from '@/components/activities/UpcomingActivities';
import type { Activity } from '@/hooks/useActivities';

export default function ActivitiesPage() {
  const { view, setView, filters } = useActivitiesStore();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const { data, isLoading } = useActivities({
    type: filters.type,
    status: filters.status,
    contactId: filters.contactId,
    dealId: filters.dealId,
    page: filters.page,
    limit: filters.limit,
  });

  const activities = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoạt động</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý cuộc gọi, email, họp và nhiệm vụ
          </p>
        </div>
        <CreateActivityDialog />
      </div>

      {/* Stats nhanh */}
      <ActivityStats />

      {/* Main content: sidebar + main */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Sắp tới */}
        <div className="lg:col-span-1">
          <UpcomingActivities />
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* View switcher + Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Danh sách
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Lịch
              </button>
            </div>

            {/* Filters (chỉ hiện ở list view) */}
            {view === 'list' && <ActivityFilters />}
          </div>

          {/* Content */}
          {view === 'calendar' ? (
            <CalendarView onActivityClick={setEditingActivity} />
          ) : (
            <ActivityListView
              activities={activities}
              isLoading={isLoading}
              meta={meta}
              onEdit={setEditingActivity}
            />
          )}
        </div>
      </div>

      {/* Edit sheet */}
      <EditActivitySheet
        activity={editingActivity}
        onClose={() => setEditingActivity(null)}
      />
    </div>
  );
}

// =====================
// Sub-components
// =====================

function ActivityStats() {
  const { data: allData } = useActivities({ limit: 200, status: 'PENDING' });
  const { data: doneData } = useActivities({ limit: 200, status: 'DONE' });

  const pendingCount = allData?.meta?.total ?? 0;
  const doneCount = doneData?.meta?.total ?? 0;

  const stats = [
    { label: 'Chờ xử lý', value: pendingCount, icon: '🕐', color: 'text-yellow-700 bg-yellow-50' },
    { label: 'Hoàn thành', value: doneCount, icon: '✅', color: 'text-green-700 bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{stat.icon}</span>
            <span className="text-sm font-medium">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

interface ActivityListViewProps {
  activities: Activity[];
  isLoading: boolean;
  meta?: { total: number; page: number; limit: number };
  onEdit: (activity: Activity) => void;
}

function ActivityListView({ activities, isLoading, meta, onEdit }: ActivityListViewProps) {
  const { setFilter } = useActivitiesStore();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-4xl mb-3">📭</p>
        <h3 className="text-base font-semibold text-gray-700 mb-1">Không có hoạt động nào</h3>
        <p className="text-sm text-gray-400">Tạo hoạt động mới để bắt đầu theo dõi</p>
      </div>
    );
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      {/* Count */}
      {meta && (
        <p className="text-sm text-gray-500 mb-3">
          Hiển thị {activities.length} / {meta.total} hoạt động
        </p>
      )}

      {/* List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} />
        ))}
      </div>

      {/* Pagination */}
      {meta && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setFilter('page', meta.page - 1)}
            disabled={meta.page <= 1}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-40"
          >
            ‹ Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {meta.page} / {totalPages}
          </span>
          <button
            onClick={() => setFilter('page', meta.page + 1)}
            disabled={meta.page >= totalPages}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-40"
          >
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}
