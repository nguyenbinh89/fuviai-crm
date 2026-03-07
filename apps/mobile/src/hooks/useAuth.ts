import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isLoading, login, logout } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    router.replace('/(tabs)');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return {
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
  };
}
