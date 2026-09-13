// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('Missing REACT_APP_API_URL environment variable');
}

const SESSION_KEY = 'regen_mapper_session';

export interface Session {
  token: string;
  user: { id: string; email: string };
}

export const getSession = (): Session | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

export const setSession = (session: Session): void =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

export const clearSession = (): void => localStorage.removeItem(SESSION_KEY);

const getToken = (): string | null => getSession()?.token ?? null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach the stored token if present
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

// ---- Auth ----

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export const signup = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/signup', { method: 'POST', body: { email, password } });

export const login = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });

// ---- Planting logs ----

export interface PlantingLogInput {
  species: string;
  quantity: number;
  location: string;
  date: string;
  notes?: string;
}

export const createPlantingLog = (log: PlantingLogInput) =>
  request('/api/planting-logs', { method: 'POST', body: log, auth: true });

export const listPlantingLogs = () => request('/api/planting-logs');

// ---- Impact stats ----

export interface ImpactStatus {
  trees_planted: number;
  zones_mapped: number;
  contributors: number;
}

export const getImpactStatus = () => request<ImpactStatus>('/api/impact');

// ---- Contact ----

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export const sendContactMessage = (payload: ContactInput) =>
  request('/api/contact', { method: 'POST', body: payload });
