import type { DealStatus } from '@/hooks/useDeals';

const STATUS_CONFIG: Record<DealStatus, { label: string; className: string }> = {
  OPEN: { label: 'Đang mở', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  WON: { label: 'Thành công', className: 'bg-green-50 text-green-700 border border-green-200' },
  LOST: { label: 'Thất bại', className: 'bg-red-50 text-red-700 border border-red-200' },
};

interface DealStatusBadgeProps {
  status: DealStatus;
}

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
