import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  company: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  LEAD: '#F59E0B',
  PROSPECT: '#3B82F6',
  CUSTOMER: '#10B981',
  INACTIVE: '#9CA3AF',
};

function ContactItem({ contact }: { contact: Contact }) {
  const initials = `${contact.firstName[0] ?? ''}${contact.lastName[0] ?? ''}`.toUpperCase();
  const color = STATUS_COLOR[contact.status] ?? '#6B7280';

  return (
    <View style={styles.contactItem}>
      <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.firstName} {contact.lastName}</Text>
        {contact.company && <Text style={styles.contactSub}>{contact.company}</Text>}
        {contact.phone && <Text style={styles.contactSub}>{contact.phone}</Text>}
      </View>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
    </View>
  );
}

export default function ContactsTab() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const { data } = await api.get('/contacts', { params: { search, limit: 30 } });
      return data.data as Contact[];
    },
    staleTime: 30_000,
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm kiếm contacts..."
          placeholderTextColor="#9CA3AF"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContactItem contact={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>Không tìm thấy contacts</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchBar: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  list: { padding: 12 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  contactSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  separator: { height: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
