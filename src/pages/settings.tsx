import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Config } from '@/lib/github';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConfigForm } from "@/components/dashboard/config-form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiClient.getConfig();
        setConfig(response);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load config');
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to load configuration. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchConfig();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your update server settings.
            </p>
          </div>

          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your update server settings.
            </p>
          </div>

          <div>Error: {error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your update server settings.
            </p>
          </div>

          <div>No config found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your update server settings.
          </p>
        </div>

        <ConfigForm initialConfig={config.data} onSaved={() => {}} />
      </main>
      <Footer />
    </div>
  );
}