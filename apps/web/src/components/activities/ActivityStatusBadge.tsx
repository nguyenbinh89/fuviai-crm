import type { ActivityStatus } from '@/hooks/useActivities';

const STATUS_CONFIG: Record<ActivityStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
  DONE: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-600' },
};

interface ActivityStatusBadgeProps {
  status: ActivityStatus;
}

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
