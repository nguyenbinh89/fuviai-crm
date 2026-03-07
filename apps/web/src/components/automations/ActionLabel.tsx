import type { ActionType } from '@/hooks/useAutomations';

export const ACTION_CONFIG: Record<ActionType, { label: string; icon: string }> = {
  SEND_EMAIL:            { label: 'Gửi Email',             icon: '✉️' },
  SEND_ZALO:             { label: 'Gửi Zalo',              icon: '💬' },
  CREATE_ACTIVITY:       { label: 'Tạo Activity',          icon: '📋' },
  UPDATE_CONTACT_STATUS: { label: 'Đổi status contact',    icon: '🔄' },
  UPDATE_DEAL_STAGE:     { label: 'Chuyển stage deal',     icon: '➡️' },
  ASSIGN_TO_USER:        { label: 'Giao cho nhân viên',    icon: '🙋' },
  ADD_TAG:               { label: 'Gắn tag',               icon: '🏷️' },
  SEND_WEBHOOK:          { label: 'Gọi Webhook',           icon: '🔗' },
  WAIT:                  { label: 'Chờ',                   icon: '⏳' },
};

export function ActionLabel({ type }: { type: ActionType }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
