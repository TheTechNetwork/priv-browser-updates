import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthCallback } from '../../hooks/use-auth';

export default function AuthCallback() {
  // Use the useAuthCallback hook which handles the entire auth flow
  const { isLoading, error } = useAuthCallback();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
            <p className="text-gray-500">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Signing in...</h1>
            <p className="text-gray-500">Please wait while we sign you in.</p>
          </>
        )}
      </div>
    </div>
  );
} 