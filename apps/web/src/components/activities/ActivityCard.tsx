'use client';

import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Activity } from '@/hooks/useActivities';
import { useCompleteActivity, useDeleteActivity } from '@/hooks/useActivities';
import { ActivityTypeBadge } from './ActivityTypeBadge';
import { ActivityStatusBadge } from './ActivityStatusBadge';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onEdit }: ActivityCardProps) {
  const complete = useCompleteActivity();
  const remove = useDeleteActivity();

  const contactName = activity.contact
    ? [activity.contact.firstName, activity.contact.lastName].filter(Boolean).join(' ')
    : null;

  const isOverdue =
    activity.dueDate &&
    activity.status === 'PENDING' &&
    isPast(new Date(activity.dueDate));

  const isDueSoon =
    activity.dueDate &&
    activity.status === 'PENDING' &&
    !isOverdue &&
    isWithinInterval(new Date(activity.dueDate), {
      start: new Date(),
      end: addDays(new Date(), 3),
    });

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        activity.status === 'DONE' ? 'opacity-60' : ''
      } ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ActivityTypeBadge type={activity.type} />
          <ActivityStatusBadge status={activity.status} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {activity.status === 'PENDING' && (
            <button
              onClick={() => complete.mutate(activity.id)}
              disabled={complete.isPending}
              className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-50 transition-colors"
              title="Đánh dấu hoàn thành"
            >
              ✓ Xong
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              title="Chỉnh sửa"
            >
              ✏️
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Xóa activity này?')) remove.mutate(activity.id);
            }}
            disabled={remove.isPending}
            className="text-gray-400 hover:text-red-500 p-1 rounded"
            title="Xóa"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-sm font-medium mb-1.5 ${
          activity.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'
        }`}
      >
        {activity.title}
      </h3>

      {/* Description */}
      {activity.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{activity.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {/* Due date */}
        {activity.dueDate && (
          <span
            className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-amber-600' : ''
            }`}
          >
            {isOverdue ? '⚠️' : '📅'}
            {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
            {isOverdue && ' (Quá hạn)'}
          </span>
        )}

        {/* Contact */}
        {contactName && (
          <span className="flex items-center gap-1">
            👤 {contactName}
          </span>
        )}

        {/* Deal */}
        {activity.deal && (
          <span className="flex items-center gap-1">
            💼 {activity.deal.title}
          </span>
        )}

        {/* Assigned to */}
        {activity.assignedTo && (
          <span className="flex items-center gap-1">
            🙋 {[activity.assignedTo.firstName, activity.assignedTo.lastName].filter(Boolean).join(' ')}
          </span>
        )}

        {/* Completed at */}
        {activity.completedAt && (
          <span className="flex items-center gap-1 text-green-600">
            ✅ {format(new Date(activity.completedAt), 'dd/MM/yyyy', { locale: vi })}
          </span>
        )}
      </div>
    </div>
  );
}
