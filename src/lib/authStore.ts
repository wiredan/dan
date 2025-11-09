import { create } from 'zustand';
import { User, AuthResponse } from '@shared/types';
import { api } from './api-client';
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('agrilink_token'),
  login: (authResponse) => {
    const { token, user } = authResponse;
    localStorage.setItem('agrilink_token', token);
    set({ isAuthenticated: true, user, token });
  },
  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem('agrilink_token');
      set({ isAuthenticated: false, user: null, token: null });
    }
  },
  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      return set({ isAuthenticated: false, user: null, token: null });
    }
    try {
      const user = await api<User>('/api/auth/me');
      set({ isAuthenticated: true, user, token });
    } catch (error) {
      console.error("Session validation failed:", error);
      localStorage.removeItem('agrilink_token');
      set({ isAuthenticated: false, user: null, token: null });
    }
  },
}));