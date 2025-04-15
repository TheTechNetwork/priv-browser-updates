import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConfigForm } from "@/components/dashboard/config-form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decryptToken } from "@/lib/secure-token";
import { useAuth, UserRole } from "@/contexts/auth-context";
import { SecurityBanner } from "@/components/auth/security-banner";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { userRole } = useAuth();
  
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      
      // Get the authentication token
      const authToken = localStorage.getItem('github_auth_token');
      if (!authToken) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to view settings.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Try to fetch from Cloudflare backend
      try {
        const response = await fetch(`${window.location.origin}/api/config`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (response.ok) {
          const configData = await response.json();
          const configMap: Record<string, string> = {};
          
          // Process each config item
          Object.entries(configData).forEach(([key, value]) => {
            // Decrypt GitHub token if present
            if (key === "githubToken" && value) {
              configMap[key] = decryptToken(value as string);
            } else {
              configMap[key] = value as string;
            }
          });
          
          setConfig(configMap);
          
          // Also update localStorage as a fallback
          localStorage.setItem('app_config', JSON.stringify(configData));
          return;
        }
      } catch (apiError) {
        console.error("Failed to fetch from API, falling back to localStorage:", apiError);
      }
      
      // Fallback to localStorage if API fails
      const storedConfig = localStorage.getItem('app_config');
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        const configMap: Record<string, string> = {};
        
        // Process each config item
        Object.entries(parsedConfig).forEach(([key, value]) => {
          // Decrypt GitHub token if present
          if (key === "githubToken" && value) {
            configMap[key] = decryptToken(value as string);
          } else {
            configMap[key] = value as string;
          }
        });
        
        setConfig(configMap);
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
      toast({
        title: "Error",
        description: "Failed to load configuration settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Chromium update server.
          </p>
        </div>

        <SecurityBanner showSensitiveData={true} />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ConfigForm initialConfig={config} onSaved={fetchConfig} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Settings;