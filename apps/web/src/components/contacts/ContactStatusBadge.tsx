import type { ContactStatus } from '@/hooks/useContacts';

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; className: string }
> = {
  LEAD: {
    label: 'Lead',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  PROSPECT: {
    label: 'Prospect',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  CUSTOMER: {
    label: 'Khách hàng',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  INACTIVE: {
    label: 'Không hoạt động',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

interface Props {
  status: ContactStatus;
}

export function ContactStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.LEAD;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
