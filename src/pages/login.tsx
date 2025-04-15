import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      // The login function will redirect to GitHub
      // We won't reach this point unless there's an error
    } catch (error) {
      console.error("GitHub login error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to initiate GitHub login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto flex h-screen items-center justify-center py-10'>
      <Card className='mx-auto w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign in</CardTitle>
          <CardDescription>
            Authenticate with GitHub to access the browser update server
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <ShieldAlert className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium">Secure Access Required</h3>
            <p className="text-sm text-muted-foreground">
              This application contains sensitive configuration data.
              Authentication is required to protect GitHub tokens and other secrets.
            </p>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  Only authorized GitHub users can access the settings page.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-10"
            onClick={handleGitHubLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            {isLoading ? "Connecting to GitHub..." : "Sign in with GitHub"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>By signing in, you agree to the application's terms of service and privacy policy.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
