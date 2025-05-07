export function getApiBaseUrl() {
  return import.meta.env.DEV ? 'http://127.0.0.1:8787' : (import.meta.env.VITE_API_URL || '');
} 