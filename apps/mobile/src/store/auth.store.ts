import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  loadFromStorage: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Lấy thông tin user hiện tại
      const { data } = await api.get('/auth/me');
      set({ user: data.data, accessToken: token, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      set({ user: null, accessToken: null, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;

    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);

    set({ user, accessToken });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Vẫn xóa token cục bộ dù API lỗi
    }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, accessToken: null });
  },

  setUser: (user) => set({ user }),
}));
