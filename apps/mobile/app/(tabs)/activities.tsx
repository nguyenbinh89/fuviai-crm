import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { api } from '@/lib/api';

interface Activity {
  id: string;
  type: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  contact: { firstName: string; lastName: string } | null;
  deal: { title: string } | null;
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  CALL:    { emoji: '📞', color: '#3B82F6' },
  EMAIL:   { emoji: '📧', color: '#8B5CF6' },
  MEETING: { emoji: '🤝', color: '#10B981' },
  TASK:    { emoji: '✅', color: '#F59E0B' },
  NOTE:    { emoji: '📝', color: '#6B7280' },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Chờ',
  COMPLETED: 'Xong',
  CANCELLED: 'Đã hủy',
};

function ActivityItem({ activity }: { activity: Activity }) {
  const cfg = TYPE_CONFIG[activity.type] ?? { emoji: '📋', color: '#6B7280' };

  return (
    <View style={styles.item}>
      <View style={[styles.typeIcon, { backgroundColor: cfg.color + '15' }]}>
        <Text style={styles.typeEmoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemSubject} numberOfLines={1}>{activity.subject}</Text>
        <Text style={styles.itemMeta}>
          {activity.contact
            ? `${activity.contact.firstName} ${activity.contact.lastName}`
            : activity.deal?.title ?? ''}
        </Text>
        {activity.scheduledAt && (
          <Text style={styles.itemDate}>
            {format(new Date(activity.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
          </Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: activity.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
        <Text style={[styles.statusText, { color: activity.status === 'COMPLETED' ? '#059669' : '#D97706' }]}>
          {STATUS_LABEL[activity.status] ?? activity.status}
        </Text>
      </View>
    </View>
  );
}

export default function ActivitiesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['activities', 'mobile'],
    queryFn: async () => {
      const { data } = await api.get('/activities', {
        params: { limit: 30, sortBy: 'scheduledAt', sortOrder: 'desc' },
      });
      return data.data as Activity[];
    },
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityItem activity={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
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
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeEmoji: { fontSize: 18 },
  itemInfo: { flex: 1 },
  itemSubject: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#6B7280' },
  itemDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '500' },
  separator: { height: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
