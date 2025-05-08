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
async function getReleases(filters?: {
  platform?: string;
  channel?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/releases', { params: filters });
  return data;
}

async function updateReleaseStatus(id: number, isActive: boolean) {
  const { data } = await api.patch(`/releases/${id}`, { isActive });
  return data;
}

async function createRelease(release: Omit<Schema['releases'], 'id' | 'createdAt'>) {
  const { data } = await api.post('/releases', release);
  return data;
}

// Stats (stub)
async function getStats() {
  return {
    totalReleases: 0,
    activeReleases: 0,
    totalDownloads: 0,
    platforms: { win: 0, mac: 0, linux: 0 },
    channels: { stable: 0, beta: 0, dev: 0 },
    downloadsTrend: [],
  };
}

// Logs
async function getLogs(params?: {
  startDate?: string;
  endDate?: string;
  platform?: string;
  channel?: string;
}) {
  const { data } = await api.get('/logs', { params });
  return data;
}

// Config
async function getConfig(): Promise<Config> {
  const { data } = await api.get('/config');
  return data;
}

async function updateConfig(config: Partial<Config>): Promise<Config> {
  const { data } = await api.put('/config', config);
  return data;
}

// GitHub Integration
async function syncGitHubReleases() {
  const { data } = await api.post('/github/sync');
  return data;
}

// Update Requests
async function createUpdateRequest(request: {
  version?: string;
  platform?: string;
  channel?: string;
  ip?: string;
  userAgent?: string;
}) {
  const { data } = await api.post('/update-requests', request);
  return data;
}

async function exportLogs(filters?: {
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
async function signUp(credentials: {
  email: string;
  password: string;
}) {
  const { data } = await api.post('/auth/signup', credentials);
  return data;
}

async function signIn(credentials: {
  email: string;
  password: string;
}) {
  const { data } = await api.post('/auth/signin', credentials);
  return data;
}

async function signOut() {
  const { data } = await api.post('/auth/signout');
  return data;
}

export const apiClient = {
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
  logInfo: (..._args: any[]) => {},
  logError: (..._args: any[]) => {},
  logWarning: (..._args: any[]) => {},
};

export default apiClient; 