// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('Missing VITE_API_URL environment variable');
}

const SESSION_KEY = 'regen_mapper_session';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  isVerified: boolean;
}

export interface Session {
  token: string;
  user: AuthUser;
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
  user: AuthUser;
}

export const signup = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/signup', { method: 'POST', body: { email, password } });

export const login = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });

export const verifyEmail = (token: string) =>
  request<{ user: AuthUser }>('/api/auth/verify-email', { method: 'POST', body: { token } });

export const resendVerification = () =>
  request<{ message: string }>('/api/auth/resend-verification', { method: 'POST', auth: true });

export const forgotPassword = (email: string) =>
  request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: { email } });

export const resetPassword = (token: string, password: string) =>
  request<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { token, password } });

export const updateProfile = (data: { displayName?: string; bio?: string }) =>
  request<{ user: AuthUser }>('/api/auth/me', { method: 'PUT', body: data, auth: true });

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
  mine?: boolean;
}

export const createPlantingLog = (log: PlantingLogInput) =>
  request<PlantingLogRecord>('/api/planting-logs', { method: 'POST', body: log, auth: true });

export const listPlantingLogs = (filters: PlantingLogFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  const query = params.toString();
  return request<PlantingLogRecord[]>(`/api/planting-logs${query ? `?${query}` : ''}`, { auth: true });
};

// ---- Impact stats ----

export interface ImpactStatus {
  trees_planted: number;
  zones_mapped: number;
  contributors: number;
}

export const getImpactStatus = () => request<ImpactStatus>('/api/impact');

// ---- Vegetation analysis ----

export interface NdviPoint {
  date: string;
  ndvi: number;
}

export interface VegetationTrend {
  slope_per_month: number;
  r_squared: number;
  direction: 'improving' | 'declining' | 'stable';
  forecast: NdviPoint[];
}

export interface VegetationAnalysis {
  zone: { id: string; name: string };
  source: 'sample' | 'gee';
  series: NdviPoint[];
  trend: VegetationTrend;
}

export const getZoneVegetation = (zoneId: string, months = 24) =>
  request<VegetationAnalysis>(`/api/zones/${zoneId}/vegetation?months=${months}`);

// ---- Contact ----

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export const sendContactMessage = (payload: ContactInput) =>
  request('/api/contact', { method: 'POST', body: payload });

// ---- Forest-loss hexes ----

export interface ForestHexProperties {
  h3: string;
  canopy2000: number;
  treeHa2000: number;
  loss: number[]; // hectares lost per year, index 0 = metadata.years[0]
}

export interface ForestHexFeature {
  type: 'Feature';
  properties: ForestHexProperties;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

export interface ForestHexCollection {
  type: 'FeatureCollection';
  metadata: {
    source: 'demo' | 'hansen-gfc';
    years: number[];
    resolution: number;
    canopyThreshold: number;
    generated: string;
    note: string;
  };
  features: ForestHexFeature[];
}

export const getForestHexes = () => request<ForestHexCollection>('/api/forest-hexes');
