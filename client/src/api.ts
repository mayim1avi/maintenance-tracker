// Tiny fetch wrapper that attaches the JWT and unwraps JSON/errors.

const TOKEN_KEY = "mt_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T = any>(
  method: string,
  url: string,
  body?: unknown,
  isForm = false
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isForm) {
      payload = body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }
  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error(data?.error || "שגיאת שרת");
  }
  return data as T;
}

export const api = {
  get: <T = any>(url: string) => request<T>("GET", url),
  post: <T = any>(url: string, body?: unknown) => request<T>("POST", url, body),
  postForm: <T = any>(url: string, form: FormData) =>
    request<T>("POST", url, form, true),
  patch: <T = any>(url: string, body?: unknown) => request<T>("PATCH", url, body),
};

// Shared types
export type Role = "staff" | "maintenance" | "admin";
export interface Employee {
  id: number;
  name: string;
  username?: string;
  role: Role;
  active?: number;
}
export interface Issue {
  id: number;
  title: string;
  description: string | null;
  location_id: number | null;
  category_id: number | null;
  priority: "low" | "medium" | "urgent";
  status: "open" | "in_progress" | "done" | "cancelled";
  reported_by: number;
  assigned_to: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  location_name: string | null;
  category_name: string | null;
  reporter_name: string | null;
  assignee_name: string | null;
}
export interface Comment {
  id: number;
  body: string;
  created_at: string;
  author_name: string;
}
export interface Location {
  id: number;
  name: string;
  zone: string | null;
  active: number;
}
export interface Category {
  id: number;
  name: string;
  active: number;
}
