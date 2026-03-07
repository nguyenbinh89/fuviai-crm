import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Deal {
  id: string;
  title: string;
  value: number;
  status: string;
  probability: number;
  contact: { firstName: string; lastName: string } | null;
  stage: { name: string; color: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#3B82F6',
  WON: '#10B981',
  LOST: '#EF4444',
};

function DealItem({ deal }: { deal: Deal }) {
  const statusColor = STATUS_COLOR[deal.status] ?? '#6B7280';
  const formattedValue = deal.value >= 1_000_000
    ? `${(deal.value / 1_000_000).toFixed(1)}M ₫`
    : `${(deal.value / 1_000).toFixed(0)}K ₫`;

  return (
    <View style={styles.dealItem}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle} numberOfLines={1}>{deal.title}</Text>
        <Text style={[styles.dealValue, { color: statusColor }]}>{formattedValue}</Text>
      </View>

      <View style={styles.dealMeta}>
        {deal.contact && (
          <Text style={styles.metaText}>
            👤 {deal.contact.firstName} {deal.contact.lastName}
          </Text>
        )}
        {deal.stage && (
          <View style={[styles.stageBadge, { backgroundColor: deal.stage.color + '20' }]}>
            <Text style={[styles.stageText, { color: deal.stage.color }]}>{deal.stage.name}</Text>
          </View>
        )}
      </View>

      {/* Thanh tiến độ xác suất */}
      <View style={styles.probabilityRow}>
        <Text style={styles.probabilityLabel}>Xác suất: {deal.probability}%</Text>
        <View style={styles.probabilityBar}>
          <View style={[styles.probabilityFill, { width: `${deal.probability}%` as any, backgroundColor: statusColor }]} />
        </View>
      </View>
    </View>
  );
}

export default function DealsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['deals', 'mobile'],
    queryFn: async () => {
      const { data } = await api.get('/deals', {
        params: { limit: 30, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      return data.data as Deal[];
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
          renderItem={({ item }) => <DealItem deal={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💼</Text>
              <Text style={styles.emptyText}>Chưa có deals nào</Text>
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
  dealItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  dealTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  dealValue: { fontSize: 15, fontWeight: '700' },
  dealMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#6B7280' },
  stageBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  stageText: { fontSize: 11, fontWeight: '500' },
  probabilityRow: { gap: 6 },
  probabilityLabel: { fontSize: 11, color: '#9CA3AF' },
  probabilityBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  probabilityFill: { height: '100%', borderRadius: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
