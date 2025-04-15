import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConfigForm } from "@/components/dashboard/config-form";
import { Loader2 } from "lucide-react";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const configs = await fine.table("configurations").select();
      
      const configMap: Record<string, string> = {};
      configs.forEach(config => {
        configMap[config.key] = config.value;
      });
      
      setConfig(configMap);
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