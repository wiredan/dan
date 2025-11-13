// src/lib/api-client.ts
import type { ApiResponse } from "../../shared/types";

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    "https://wiredan.com/api";

  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include", // so cookies (sessions) work!
    ...init,
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || "Request failed");
  }

  return json.data;
}

// --- Helper methods ---
export const apiGet = <T>(path: string) =>
  api<T>(path, { method: "GET" });

export const apiPost = <T, B = any>(path: string, body: B) =>
  api<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPut = <T, B = any>(path: string, body: B) =>
  api<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });