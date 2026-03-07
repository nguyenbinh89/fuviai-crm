import type { TriggerType } from '@/hooks/useAutomations';

export const TRIGGER_CONFIG: Record<TriggerType, { label: string; icon: string; description: string }> = {
  CONTACT_CREATED:        { label: 'Contact mới',          icon: '👤', description: 'Khi tạo contact mới' },
  CONTACT_STATUS_CHANGED: { label: 'Đổi status contact',   icon: '🔄', description: 'Khi status contact thay đổi' },
  DEAL_CREATED:           { label: 'Deal mới',             icon: '💼', description: 'Khi tạo deal mới' },
  DEAL_STAGE_CHANGED:     { label: 'Deal chuyển stage',    icon: '➡️', description: 'Khi deal chuyển sang stage khác' },
  DEAL_WON:               { label: 'Deal thắng',           icon: '🏆', description: 'Khi deal chuyển sang Won' },
  DEAL_LOST:              { label: 'Deal thua',            icon: '❌', description: 'Khi deal chuyển sang Lost' },
  CONVERSATION_RECEIVED:  { label: 'Tin nhắn đến',         icon: '💬', description: 'Khi nhận tin nhắn inbound mới' },
  ACTIVITY_DUE:           { label: 'Activity đến hạn',     icon: '⏰', description: 'Khi activity đến hạn thực hiện' },
  MANUAL:                 { label: 'Thủ công',             icon: '▶️', description: 'Kích hoạt thủ công' },
};

export function TriggerBadge({ trigger }: { trigger: TriggerType }) {
  const cfg = TRIGGER_CONFIG[trigger];
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
      {cfg.icon} {cfg.label}
    </span>
  );
}
