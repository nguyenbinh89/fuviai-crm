import type { CampaignStatus } from '@/hooks/useEmailMarketing';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string; icon: string }> = {
  DRAFT:     { label: 'Nháp',       icon: '📝', className: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: 'Đã lên lịch', icon: '🗓️', className: 'bg-blue-100 text-blue-700' },
  SENDING:   { label: 'Đang gửi',   icon: '📤', className: 'bg-yellow-100 text-yellow-700' },
  SENT:      { label: 'Đã gửi',     icon: '✅', className: 'bg-green-100 text-green-700' },
  FAILED:    { label: 'Thất bại',   icon: '❌', className: 'bg-red-100 text-red-700' },
};

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.icon} {config.label}
    </span>
  );
}
