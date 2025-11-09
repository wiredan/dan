import { ApiResponse } from "../../shared/types";
import { useAuthStore } from "./authStore";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorJson = await res.json();
      throw new Error(errorJson.error || 'Request failed');
    } else {
      const errorText = await res.text();
      throw new Error(errorText || 'Request failed');
    }
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}