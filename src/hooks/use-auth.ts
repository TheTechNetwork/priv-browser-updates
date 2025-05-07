import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth as useAuthStore, exchangeCodeForToken, getUserData } from '@/lib/auth';
import type { User } from '@/lib/auth';

export const useAuth = useAuthStore;

export function useAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error, signOut, setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        await signOut();
        navigate('/login', { replace: true });
        return;
      }

      if (!code && !token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        let accessToken: string;
        
        if (token) {
          // If we got the token directly from the worker
          accessToken = token;
        } else {
          // If we got the code from GitHub, exchange it for a token
          accessToken = await exchangeCodeForToken(code!);
        }

        localStorage.setItem('github_token', accessToken);
        const userData = await getUserData(accessToken);
        
        // Initialize the auth state
        setUser(userData);
        
        navigate('/', { replace: true });
      } catch (error) {
        await signOut();
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate, signOut, setUser]);

  return { isLoading, error };
}