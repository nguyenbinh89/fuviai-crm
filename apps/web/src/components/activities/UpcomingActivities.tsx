'use client';

import { format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useUpcomingActivities, useCompleteActivity } from '@/hooks/useActivities';
import { ActivityTypeBadge } from './ActivityTypeBadge';

export function UpcomingActivities() {
  const { data: activities = [], isLoading } = useUpcomingActivities();
  const complete = useCompleteActivity();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Sắp tới (7 ngày)</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Sắp tới (7 ngày)
        {activities.length > 0 && (
          <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
            {activities.length}
          </span>
        )}
      </h3>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          Không có hoạt động nào sắp tới
        </p>
      ) : (
        <div className="space-y-2">
          {activities.map((act) => {
            const overdue = act.dueDate && isPast(new Date(act.dueDate));
            return (
              <div
                key={act.id}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  overdue ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                {/* Type badge */}
                <div className="shrink-0 mt-0.5">
                  <ActivityTypeBadge type={act.type} showIcon />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{act.title}</p>
                  {act.dueDate && (
                    <p className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                      {format(new Date(act.dueDate), 'EEE, dd/MM HH:mm', { locale: vi })}
                      {overdue && ' ⚠️'}
                    </p>
                  )}
                </div>

                {/* Complete button */}
                <button
                  onClick={() => complete.mutate(act.id)}
                  disabled={complete.isPending}
                  className="shrink-0 text-xs text-green-600 hover:text-green-700 border border-green-300 rounded px-1.5 py-0.5 hover:bg-green-50"
                  title="Đánh dấu xong"
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
