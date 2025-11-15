// src/lib/api-client.ts
import type { ApiResponse } from "../../shared/types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://wiredan.com/api";

// -------------------------------
// Generic API Caller
// -------------------------------
export async function api<T>(
  path: string,
  init: RequestInit = {},
  auth = true
): Promise<T> {
  const token = auth ? localStorage.getItem("authToken") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }

  return json.data!;
}

// Helpers
export const apiGet = <T>(path: string) =>
  api<T>(path, { method: "GET" });

export const apiPost = <T, B = any>(path: string, body: B, auth = true) =>
  api<T>(
    path,
    { method: "POST", body: JSON.stringify(body) },
    auth
  );

export const apiPut = <T, B = any>(path: string, body: B) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });

// ---------------------------------------------
// LOGIN
// ---------------------------------------------
export async function login(credentials: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!data.ok) throw new Error(data.error || "Login failed");

  // store KV session token
  localStorage.setItem("authToken", data.data.token);

  return data.data; // { token, user }
}

// ---------------------------------------------
// LOGOUT
// ---------------------------------------------
export async function logout() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  localStorage.removeItem("authToken");
}

// ---------------------------------------------
// CHECK AUTH SESSION (/me)
// ---------------------------------------------
export async function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!data.ok) return null;

  return data.data; // user
}