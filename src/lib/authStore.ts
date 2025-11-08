import { create } from 'zustand';
import { User } from '@shared/types';
import { MOCK_USERS } from '@shared/mock-data';
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (email) => {
    // Mock login: find a user with a matching name part or default to the first user
    const foundUser = MOCK_USERS.find(u => u.name.toLowerCase().includes(email.split('@')[0])) || MOCK_USERS[0];
    set({ isAuthenticated: true, user: foundUser });
  },
  logout: () => set({ isAuthenticated: false, user: null }),
}));