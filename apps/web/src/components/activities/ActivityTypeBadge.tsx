import type { ActivityType } from '@/hooks/useActivities';

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: string; className: string }> = {
  CALL: { label: 'Cuộc gọi', icon: '📞', className: 'bg-blue-100 text-blue-800' },
  EMAIL: { label: 'Email', icon: '✉️', className: 'bg-purple-100 text-purple-800' },
  MEETING: { label: 'Họp', icon: '🤝', className: 'bg-green-100 text-green-800' },
  TASK: { label: 'Nhiệm vụ', icon: '✅', className: 'bg-orange-100 text-orange-800' },
};

interface ActivityTypeBadgeProps {
  type: ActivityType;
  showIcon?: boolean;
}

export function ActivityTypeBadge({ type, showIcon = true }: ActivityTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

export function getActivityTypeIcon(type: ActivityType): string {
  return TYPE_CONFIG[type].icon;
}
