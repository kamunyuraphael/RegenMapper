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

// ---- Zones ----

export interface Zone {
  _id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  targetTrees?: number;
}

export interface ZoneInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  targetTrees?: number;
}

export const listZones = () => request<Zone[]>('/api/zones');

export const createZone = (zone: ZoneInput) =>
  request<Zone>('/api/zones', { method: 'POST', body: zone, auth: true });

// ---- Planting logs ----

export interface PlantingLogInput {
  species: string;
  quantity: number;
  zone: string; // Zone _id
  latitude: number;
  longitude: number;
  date: string;
  notes?: string;
}

export interface PlantingLogRecord {
  _id: string;
  species: string;
  quantity: number;
  zone: { _id: string; name: string } | null;
  latitude: number;
  longitude: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface PlantingLogFilters {
  zone?: string;
  species?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const createPlantingLog = (log: PlantingLogInput) =>
  request<PlantingLogRecord>('/api/planting-logs', { method: 'POST', body: log, auth: true });

export const listPlantingLogs = (filters: PlantingLogFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return request<PlantingLogRecord[]>(`/api/planting-logs${query ? `?${query}` : ''}`);
};

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
