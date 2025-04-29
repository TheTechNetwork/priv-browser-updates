import { create } from 'zustand';
import { apiClient } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
}

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = `http://127.0.0.1:8787/api/auth/github/callback`;

interface GitHubUserData {
  id: number;
  name?: string;
  login: string;
  email: string;
  avatar_url: string;
}

export interface AuthResponse {
  access_token: string;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  signInWithGitHub: async () => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'read:user user:email',
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  },

  signOut: async () => {
    try {
      localStorage.removeItem('github_token');
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error : new Error('Failed to sign out') });
    }
  },

  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  }
}));

// Initialize auth state by checking for existing token
export const initializeAuth = async () => {
  const token = localStorage.getItem('github_token');
  
  if (!token) {
    useAuth.setState({ isLoading: false });
    return;
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json() as GitHubUserData;
    
    useAuth.setState({
      user: {
        id: userData.id.toString(),
        name: userData.name || userData.login,
        email: userData.email,
        avatar: userData.avatar_url,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  } catch (error) {
    useAuth.setState({
      error: error instanceof Error ? error : new Error('Failed to initialize auth'),
      isLoading: false,
    });
  }
};

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await apiClient.post<AuthResponse>('/api/auth/github/callback', { code });
  return response.data.access_token;
}

export async function getUserData(accessToken: string): Promise<User> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  const userData = await response.json() as GitHubUserData;

  return {
    id: userData.id.toString(),
    name: userData.name || userData.login,
    email: userData.email,
    avatar: userData.avatar_url,
  };
} 