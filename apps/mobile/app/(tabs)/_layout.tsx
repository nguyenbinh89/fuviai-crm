import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { accessToken, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!accessToken) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600', fontSize: 16, color: '#111827' },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: () => <TabIcon emoji="👥" />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: () => <TabIcon emoji="💼" />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Hoạt động',
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Hộp thư',
          tabBarIcon: () => <TabIcon emoji="💬" />,
        }}
      />
    </Tabs>
  );
}
