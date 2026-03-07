import type { ConversationChannel } from '@/hooks/useConversations';

const CHANNEL_CONFIG: Record<ConversationChannel, { label: string; icon: string; className: string }> = {
  ZALO:  { label: 'Zalo',  icon: '💬', className: 'bg-blue-100 text-blue-700' },
  EMAIL: { label: 'Email', icon: '✉️', className: 'bg-purple-100 text-purple-700' },
  SMS:   { label: 'SMS',   icon: '📱', className: 'bg-green-100 text-green-700' },
  WEB:   { label: 'Web',   icon: '🌐', className: 'bg-gray-100 text-gray-700' },
};

interface ChannelBadgeProps {
  channel: ConversationChannel;
  showLabel?: boolean;
}

export function ChannelBadge({ channel, showLabel = false }: ChannelBadgeProps) {
  const cfg = CHANNEL_CONFIG[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
      {cfg.icon}
      {showLabel && cfg.label}
    </span>
  );
}

export function getChannelIcon(channel: ConversationChannel): string {
  return CHANNEL_CONFIG[channel].icon;
}
