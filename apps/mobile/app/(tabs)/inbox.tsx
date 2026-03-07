import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/lib/api';

interface Conversation {
  id: string;
  channel: string;
  status: string;
  contact: { firstName: string; lastName: string } | null;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
}

const CHANNEL_CONFIG: Record<string, { emoji: string; color: string }> = {
  ZALO:  { emoji: '💬', color: '#0068FF' },
  EMAIL: { emoji: '📧', color: '#7C3AED' },
  SMS:   { emoji: '📱', color: '#059669' },
  CHAT:  { emoji: '🗨️', color: '#F59E0B' },
};

function ConversationItem({ conv }: { conv: Conversation }) {
  const cfg = CHANNEL_CONFIG[conv.channel] ?? { emoji: '💬', color: '#6B7280' };
  const contactName = conv.contact
    ? `${conv.contact.firstName} ${conv.contact.lastName}`
    : 'Ẩn danh';

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <View style={[styles.channelIcon, { backgroundColor: cfg.color + '15' }]}>
        <Text style={styles.channelEmoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={styles.itemName}>{contactName}</Text>
          {conv.lastMessage && (
            <Text style={styles.itemTime}>
              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: vi })}
            </Text>
          )}
        </View>
        {conv.lastMessage && (
          <Text style={styles.itemPreview} numberOfLines={1}>
            {conv.lastMessage.content}
          </Text>
        )}
        <View style={styles.itemFooter}>
          <View style={[styles.channelBadge, { backgroundColor: cfg.color + '15' }]}>
            <Text style={[styles.channelBadgeText, { color: cfg.color }]}>{conv.channel}</Text>
          </View>
        </View>
      </View>
      {conv.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function InboxTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations', 'mobile'],
    queryFn: async () => {
      const { data } = await api.get('/conversations', { params: { limit: 30 } });
      return data.data as Conversation[];
    },
    staleTime: 15_000,
    refetchInterval: 30_000, // Tự động refresh mỗi 30s
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationItem conv={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>Hộp thư trống</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelEmoji: { fontSize: 20 },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemTime: { fontSize: 11, color: '#9CA3AF' },
  itemPreview: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  itemFooter: { marginTop: 6 },
  channelBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  channelBadgeText: { fontSize: 10, fontWeight: '600' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  separator: { height: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
