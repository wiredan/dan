import { create } from 'zustand';
import { User } from '@shared/types';
import { MOCK_USERS } from '@shared/mock-data';
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}
const getInitialState = () => {
  try {
    const authData = localStorage.getItem('agrilink_auth');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state.isAuthenticated && state.user) {
        return { isAuthenticated: true, user: state.user as User };
      }
    }
  } catch (error) {
    console.error("Could not parse auth data from localStorage", error);
  }
  return { isAuthenticated: false, user: null };
};
export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  login: (email) => {
    const foundUser = MOCK_USERS.find(u => u.id.toLowerCase().includes(email.toLowerCase()) || u.name.toLowerCase().includes(email.split('@')[0])) || MOCK_USERS[0];
    const newState = { isAuthenticated: true, user: foundUser };
    set(newState);
    try {
      localStorage.setItem('agrilink_auth', JSON.stringify({ state: newState }));
    } catch (error) {
      console.error("Could not save auth data to localStorage", error);
    }
  },
  logout: () => {
    const newState = { isAuthenticated: false, user: null };
    set(newState);
    try {
      localStorage.removeItem('agrilink_auth');
    } catch (error) {
      console.error("Could not remove auth data from localStorage", error);
    }
  },
}));