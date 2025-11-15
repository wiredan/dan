// src/store/AuthStore.ts
import { create } from "zustand";
import { User } from "@shared/types";
import { apiGet } from "../lib/api-client";

interface AuthResponse {
  token: string;
  user: User;
}

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

  // -----------------------------
  // SIGNUP
  // -----------------------------
  signupWithEmail: async (name, email, password) => {
    const res = await fetch("https://wiredan.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Signup failed");

    // Signup doesn't log them in
  },

  // -----------------------------
  // LOGIN
  // -----------------------------
  loginWithEmail: async (email, password) => {
    const res = await fetch("https://wiredan.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Login failed");

    const data: AuthResponse = json.data;

    localStorage.setItem("authToken", data.token);

    set({
      isAuthenticated: true,
      user: data.user,
    });
  },

  // -----------------------------
  // LOGOUT
  // -----------------------------
  logout: async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      await fetch("https://wiredan.com/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    localStorage.removeItem("authToken");
    set({ isAuthenticated: false, user: null });
  },

  // -----------------------------
  // CHECK SESSION
  // -----------------------------
  checkAuth: async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    const res = await fetch("https://wiredan.com/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!json.ok) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({
      isAuthenticated: true,
      user: json.data,
    });
  },
}));