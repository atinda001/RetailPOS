import { create } from 'zustand';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  storeId: string;
  terminalId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  pinLogin: (terminalId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string }; user: User } }>('/auth/login', { email, password });
    const { tokens, user } = res.data;
    apiClient.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
  },

  pinLogin: async (terminalId: string, pin: string) => {
    const res = await apiClient.post<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string }; user: User } }>('/auth/pin-login', { terminalId, pin });
    const { tokens, user } = res.data;
    apiClient.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    apiClient.clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  setAuth: (user, accessToken, refreshToken) => {
    apiClient.setTokens(accessToken, refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: () => {
    apiClient.clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  }
}));
