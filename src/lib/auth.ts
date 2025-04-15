// GitHub OAuth authentication client for the browser
import { useState, useEffect } from 'react';

// Types for authentication
export interface User {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  error: string | null;
  expiresAt: string | null;
}

// Constants
const AUTH_TOKEN_KEY = 'auth_token';
const API_BASE_URL = '/api';

// Helper functions
export async function getAuthConfig(): Promise<{ clientId: string; redirectUri: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/config`);
  if (!response.ok) {
    throw new Error('Failed to get auth configuration');
  }
  return response.json();
}

export async function loginWithGitHub(code: string): Promise<{ 
  token: string; 
  user: User; 
  isAdmin: boolean;
  expiresAt: string;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to authenticate with GitHub');
  }

  return response.json();
}

export async function verifyToken(token: string): Promise<{
  authenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  expiresAt: string | null;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { authenticated: false, user: null, isAdmin: false, expiresAt: null };
    }

    return response.json();
  } catch (error) {
    console.error('Error verifying token:', error);
    return { authenticated: false, user: null, isAdmin: false, expiresAt: null };
  }
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// React hook for authentication
export function useAuth(): AuthState & {
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    error: null,
    expiresAt: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          isAdmin: false,
          error: null,
          expiresAt: null,
        });
        return;
      }

      try {
        const { authenticated, user, isAdmin, expiresAt } = await verifyToken(token);
        setState({
          isLoading: false,
          isAuthenticated: authenticated,
          user,
          isAdmin,
          error: null,
          expiresAt,
        });
      } catch (error) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          isAdmin: false,
          error: 'Failed to verify authentication',
          expiresAt: null,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (code: string) => {
    setState({ ...state, isLoading: true, error: null });
    try {
      const { token, user, isAdmin, expiresAt } = await loginWithGitHub(code);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        isAdmin,
        error: null,
        expiresAt,
      });
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login',
      });
    }
  };

  const handleLogout = async () => {
    setState({ ...state, isLoading: true });
    await logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      isAdmin: false,
      error: null,
      expiresAt: null,
    });
  };

  return {
    ...state,
    login,
    logout: handleLogout,
  };
}

// API client with authentication
export function createAuthenticatedApiClient() {
  const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

  return {
    async get<T>(endpoint: string): Promise<T> {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    },
    
    async post<T>(endpoint: string, data: any): Promise<T> {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    },
    
    async put<T>(endpoint: string, data: any): Promise<T> {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    },
    
    async delete<T>(endpoint: string): Promise<T> {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    },
  };
}

export const api = createAuthenticatedApiClient();