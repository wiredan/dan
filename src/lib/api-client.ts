import { ApiResponse } from "../../shared/types";
import { useAuthStore } from "./authStore";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  console.log('API call initiated for path:', path);
  const token = useAuthStore.getState().token;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), 8000)
  );

  const fetchPromise = fetch(path, { ...init, headers });

  const res = await Promise.race([fetchPromise, timeoutPromise]);
  console.log('Fetch completed with status:', res.status);
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
  console.log('JSON parsing successful:', JSON.stringify(json));
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}