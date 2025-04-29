import axios from 'axios';
import type { Config } from './github';

interface ReleaseData {
  version: string;
  channel: string;
  platform: string;
  downloadUrl: string;
  releaseNotes: string;
  fileSize: number;
  isActive: boolean;
}

// Use the worker URL directly in development
const API_BASE_URL = import.meta.env.DEV ? 'http://127.0.0.1:8787' : (import.meta.env.VITE_API_URL || '');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('github_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  async getConfig() {
    const response = await axiosInstance.get<Config['data']>('/api/config');
    return response;
  },

  async updateConfig(config: Config['data']) {
    const response = await axiosInstance.put<Config['data']>('/api/config', config);
    return response;
  },

  async createRelease(releaseData: ReleaseData) {
    const response = await axiosInstance.post<ReleaseData>('/api/releases', releaseData);
    return response.data;
  },

  async post<T>(url: string, data: unknown) {
    const response = await axiosInstance.post<T>(url, data);
    return response.data;
  },
}; 