import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import type { RecentActivity } from '@/hooks/useDashboard';

const TYPE_ICON: Record<string, string> = {
  CALL: '📞', EMAIL: '✉️', MEETING: '🤝', TASK: '✅',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-600', DONE: 'text-green-600', CANCELLED: 'text-gray-400',
};

interface RecentActivityWidgetProps {
  activities: RecentActivity[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Hoạt động gần đây</h3>
        <Link href="/activities" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có hoạt động nào</p>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3">
              {/* Icon */}
              <span className="shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm mt-0.5">
                {TYPE_ICON[act.type] ?? '📋'}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate font-medium">{act.subject}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 flex-wrap">
                  {act.contact && <span>{act.contact}</span>}
                  {act.deal && <><span>·</span><span className="truncate">{act.deal}</span></>}
                  {act.assignedTo && <><span>·</span><span>🙋 {act.assignedTo}</span></>}
                </div>
              </div>

              {/* Status + time */}
              <div className="text-right shrink-0">
                <p className={`text-xs font-medium ${STATUS_COLOR[act.status] ?? 'text-gray-500'}`}>
                  {act.status === 'DONE' ? '✓ Xong' : act.status === 'CANCELLED' ? '✗ Hủy' : '⏳ Chờ'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: vi })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
