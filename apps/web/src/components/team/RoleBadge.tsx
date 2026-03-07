import type { UserRole, UserStatus } from '@/hooks/useTeam';

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  OWNER:  { label: 'Owner',  className: 'bg-purple-100 text-purple-700' },
  ADMIN:  { label: 'Admin',  className: 'bg-blue-100 text-blue-700' },
  MEMBER: { label: 'Member', className: 'bg-gray-100 text-gray-600' },
  VIEWER: { label: 'Viewer', className: 'bg-green-100 text-green-700' },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; dot: string }> = {
  ACTIVE:    { label: 'Hoạt động', dot: 'bg-green-500' },
  INACTIVE:  { label: 'Không hoạt động', dot: 'bg-gray-400' },
  SUSPENDED: { label: 'Tạm khóa', dot: 'bg-red-500' },
};

export function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function StatusDot({ status }: { status: UserStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
