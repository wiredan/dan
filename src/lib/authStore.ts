// src/store/AuthStore.ts import { login } from './api-client';

interface AuthState {
  user: any | null;
  token: string | null;
}

const authState: AuthState = {
  user: null,
  token: null,
};

export async function loginUser(email: string, password: string) {
  try {
    const { token, user } = await login({ email, password });
    authState.user = user;
    authState.token = token;

    // Optionally persist token in localStorage
    localStorage.setItem('authToken', token);

    return user;
  } catch (err) {
    console.error('Login failed:', err);
    throw err;
  }
}

export function logoutUser() {
  authState.user = null;
  authState.token = null;
  localStorage.removeItem('authToken');
}

import { create } from "zustand";
import { User } from "@shared/types";
import { apiGet, apiPost } from "../lib/api-client";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  // --- Email/Password Signup ---
  signupWithEmail: async (name, email, password) => {
    try {
      const user = await apiPost<User>("/auth/signup", { name, email, password });
      set({ isAuthenticated: true, user });
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  },

  // --- Email/Password Login ---
  loginWithEmail: async (email, password) => {
    try {
      const user = await apiPost<User>("/auth/login", { email, password });
      set({ isAuthenticated: true, user });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  // --- Logout (clears KV session) ---
  logout: async () => {
    try {
      await apiPost("/auth/logout", {});
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      set({ isAuthenticated: false, user: null });
    }
  },

  // --- Check Session ---
  checkAuth: async () => {
    try {
      const user = await apiGet<User>("/auth/me");
      set({ isAuthenticated: true, user });
    } catch {
      set({ isAuthenticated: false, user: null });
    }
  },
}));
import { logout } from './api-client';

export async function logoutUser() {
  try {
    await logout();
  } catch (err) {
    console.error('Logout failed:', err);
  } finally {
    // Clear local state regardless
    authState.user = null;
    authState.token = null;
    localStorage.removeItem('authToken');
  }
}
