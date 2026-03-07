import type { WorkflowStatus, WorkflowRunStatus } from '@/hooks/useAutomations';

const STATUS_CONFIG: Record<WorkflowStatus, { label: string; className: string }> = {
  ACTIVE:   { label: 'Đang hoạt động', className: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Tạm dừng',       className: 'bg-gray-100 text-gray-500' },
  DRAFT:    { label: 'Nháp',           className: 'bg-yellow-100 text-yellow-700' },
};

const RUN_STATUS_CONFIG: Record<WorkflowRunStatus, { label: string; className: string }> = {
  PENDING:   { label: 'Chờ',       className: 'bg-gray-100 text-gray-500' },
  RUNNING:   { label: 'Đang chạy', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Thành công', className: 'bg-green-100 text-green-700' },
  FAILED:    { label: 'Lỗi',       className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Đã hủy',    className: 'bg-gray-100 text-gray-500' },
};

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function WorkflowRunStatusBadge({ status }: { status: WorkflowRunStatus }) {
  const cfg = RUN_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
