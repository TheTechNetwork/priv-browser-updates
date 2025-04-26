import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/');
      return;
    }

    signIn(code).then(() => {
      navigate('/');
    });
  }, [navigate, searchParams, signIn]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Signing in...</h1>
        <p className="text-gray-500">Please wait while we sign you in.</p>
      </div>
    </div>
  );
} 