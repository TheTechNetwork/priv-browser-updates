import { useAuthCallback } from '@/hooks/use-auth';

export default function AuthCallback() {
  const { isLoading, error } = useAuthCallback();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
            <p className="text-gray-500">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Signing in...</h1>
            <p className="text-gray-500">Please wait while we sign you in.</p>
            {isLoading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 