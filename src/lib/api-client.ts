import axios from 'axios';
import type { Schema } from './db-types';

interface Config {
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  releasePattern?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Releases
export async function getReleases(filters?: {
  platform?: string;
  channel?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/releases', { params: filters });
  return data;
}

export async function updateReleaseStatus(id: number, isActive: boolean) {
  const { data } = await api.patch(`/releases/${id}`, { isActive });
  return data;
}

export async function createRelease(release: Omit<Schema['releases'], 'id' | 'createdAt'>) {
  const { data } = await api.post('/releases', release);
  return data;
}

// Stats
export async function getStats() {
  const { data } = await api.get('/stats');
  return data;
}

// Logs
export async function getLogs(params?: {
  startDate?: string;
  endDate?: string;
  platform?: string;
  channel?: string;
}) {
  const { data } = await api.get('/logs', { params });
  return data;
}

// Config
export async function getConfig(): Promise<Config> {
  const { data } = await api.get('/config');
  return data;
}

export async function updateConfig(config: Partial<Config>): Promise<Config> {
  const { data } = await api.put('/config', config);
  return data;
}

// GitHub Integration
export async function syncGitHubReleases() {
  const { data } = await api.post('/github/sync');
  return data;
}

// Update Requests
export async function createUpdateRequest(request: {
  version?: string;
  platform?: string;
  channel?: string;
  ip?: string;
  userAgent?: string;
}) {
  const { data } = await api.post('/update-requests', request);
  return data;
}

export async function exportLogs(filters?: {
  startDate?: string;
  endDate?: string;
  platform?: string;
  channel?: string;
}) {
  const { data } = await api.get('/logs/export', { 
    params: filters,
    responseType: 'blob'
  });
  return data;
}

// Auth
export async function signUp(credentials: {
  email: string;
  password: string;
}) {
  const { data } = await api.post('/auth/signup', credentials);
  return data;
}

export async function signIn(credentials: {
  email: string;
  password: string;
}) {
  const { data } = await api.post('/auth/signin', credentials);
  return data;
}

export async function signOut() {
  const { data } = await api.post('/auth/signout');
  return data;
}

const apiClient = {
  getReleases,
  updateReleaseStatus,
  createRelease,
  getStats,
  getLogs,
  getConfig,
  updateConfig,
  syncGitHubReleases,
  createUpdateRequest,
  exportLogs,
  signUp,
  signIn,
  signOut,
};

export default apiClient; 