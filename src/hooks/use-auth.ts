import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // TODO: Implement actual auth check logic here
        const session = localStorage.getItem('session');
        if (session) {
          const user = JSON.parse(session);
          setAuthState({ user, isLoading: false, error: null });
        } else {
          setAuthState({ user: null, isLoading: false, error: null });
        }
      } catch (error) {
        setAuthState({ 
          user: null, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Authentication error' 
        });
      }
    };

    checkAuth();
  }, []);

  const signIn = async (authCode: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      // TODO: Implement actual OAuth sign in logic here using authCode
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      });
      
      if (!response.ok) {
        throw new Error('Sign in failed');
      }
      
      const user = await response.json();
      localStorage.setItem('session', JSON.stringify(user));
      setAuthState({ user, isLoading: false, error: null });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      }));
      throw error;
    }
  };

  const login = async (email: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      // TODO: Implement actual login logic here
      const user = { id: '1', email };
      localStorage.setItem('session', JSON.stringify(user));
      setAuthState({ user, isLoading: false, error: null });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }));
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      localStorage.removeItem('session');
      setAuthState({ user: null, isLoading: false, error: null });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      }));
    }
  };

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn,
    login,
    logout,
  };
} 