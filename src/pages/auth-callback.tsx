import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { exchangeCodeForToken, getAuthenticatedUser, saveAuthToken, saveUser } from "@/lib/github-auth";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        
        if (!code) {
          setError("No authorization code found in the URL");
          return;
        }
        
        // Exchange the code for an access token
        const token = await exchangeCodeForToken(code);
        
        // Save the token
        saveAuthToken(token);
        
        // Get the user information
        const user = await getAuthenticatedUser(token);
        
        // Save the user
        saveUser(user);
        
        // Redirect to the home page
        navigate("/");
      } catch (error) {
        console.error("Error handling OAuth callback:", error);
        setError("Failed to authenticate with GitHub. Please try again.");
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg">Authenticating with GitHub...</p>
    </div>
  );
};

export default AuthCallback;