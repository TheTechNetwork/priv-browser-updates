import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { exchangeCodeForToken, getUserData, type User } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const login = async () => {
    try {
      setAuthState({ ...authState, isLoading: true, error: null });
      // Implement login logic here
      setAuthState({ ...authState, isLoading: false });
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isLoading: false,
      error: null
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
}

export function useAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>(initialState);

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (!code) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const accessToken = await exchangeCodeForToken(code);
        const user = await getUserData(accessToken);

        setAuthState({ user, isLoading: false, error: null });
        navigate('/', { replace: true });
      } catch (error) {
        setAuthState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        });
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate]);

  return authState;
} 