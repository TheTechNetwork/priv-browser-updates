import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function LoginForm() {
  const { signInWithGitHub, isLoading } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={signInWithGitHub}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
