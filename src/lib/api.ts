import axios from 'axios';

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
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  async get<T>(url: string) {
    const response = await axiosInstance.get<T>(url);
    return response;
  },

  async post<T>(url: string, data: unknown) {
    const response = await axiosInstance.post<T>(url, data);
    return response;
  },

  async put<T>(url: string, data: unknown) {
    const response = await axiosInstance.put<T>(url, data);
    return response;
  },

  async delete(url: string) {
    const response = await axiosInstance.delete(url);
    return response;
  }
}; 