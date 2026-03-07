import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface OverviewData {
  totalContacts: number;
  totalDeals: number;
  totalRevenue: number;
  activeDeals: number;
  contactsGrowth: number;
  revenueGrowth: number;
}

function KpiCard({
  label,
  value,
  growth,
  color,
}: {
  label: string;
  value: string;
  growth?: number;
  color: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {growth !== undefined && (
        <Text style={[styles.kpiGrowth, { color: growth >= 0 ? '#16A34A' : '#DC2626' }]}>
          {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% so với tháng trước
        </Text>
      )}
    </View>
  );
}

export default function DashboardTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: overview, isLoading } = useQuery<OverviewData>({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/overview');
      return data.data;
    },
    staleTime: 60_000,
  });

  const formatVND = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ₫`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₫`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ₫`;
    return `${amount} ₫`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Xin chào, {user?.firstName ?? 'bạn'} 👋
        </Text>
        <TouchableOpacity onPress={() => logout()}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tổng quan tháng này</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#2563EB" />
      ) : (
        <View style={styles.kpiGrid}>
          <KpiCard
            label="Tổng Contacts"
            value={(overview?.totalContacts ?? 0).toLocaleString('vi-VN')}
            growth={overview?.contactsGrowth}
            color="#2563EB"
          />
          <KpiCard
            label="Deals đang mở"
            value={(overview?.activeDeals ?? 0).toLocaleString('vi-VN')}
            color="#7C3AED"
          />
          <KpiCard
            label="Doanh thu"
            value={formatVND(overview?.totalRevenue ?? 0)}
            growth={overview?.revenueGrowth}
            color="#059669"
          />
          <KpiCard
            label="Tổng Deals"
            value={(overview?.totalDeals ?? 0).toLocaleString('vi-VN')}
            color="#D97706"
          />
        </View>
      )}

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Thao tác nhanh</Text>
      <View style={styles.quickActions}>
        {[
          { label: '+ Contact mới', screen: '/(tabs)/contacts', emoji: '👥' },
          { label: '+ Deal mới', screen: '/(tabs)/deals', emoji: '💼' },
          { label: 'Xem hộp thư', screen: '/(tabs)/inbox', emoji: '💬' },
          { label: 'Hoạt động', screen: '/(tabs)/activities', emoji: '📋' },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            onPress={() => router.push(action.screen as any)}
          >
            <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 32 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  logoutText: { fontSize: 13, color: '#6B7280' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiGrid: { gap: 10 },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  kpiGrowth: { fontSize: 11, marginTop: 4 },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontSize: 13, fontWeight: '500', color: '#374151', textAlign: 'center' },
});
