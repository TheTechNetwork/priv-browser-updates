import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChannelSettings {
  stableChannel: boolean;
  betaChannel: boolean;
  devChannel: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ChannelSettings>({
    stableChannel: true,
    betaChannel: true,
    devChannel: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get<ChannelSettings>('/api/settings');
        setSettings(response.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [toast]);

  const handleToggleChannel = (channel: keyof ChannelSettings) => {
    setSettings(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/settings', settings);
      toast({
        title: "Success",
        description: "Settings saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle>Update Channels</CardTitle>
            <CardDescription>
              Configure which update channels are active for your users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stableChannel">Stable Channel</Label>
                <p className="text-sm text-muted-foreground">
                  Production-ready releases for general users.
                </p>
              </div>
              <Switch
                id="stableChannel"
                checked={settings.stableChannel}
                onCheckedChange={() => handleToggleChannel('stableChannel')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="betaChannel">Beta Channel</Label>
                <p className="text-sm text-muted-foreground">
                  Pre-release versions for testing new features.
                </p>
              </div>
              <Switch
                id="betaChannel"
                checked={settings.betaChannel}
                onCheckedChange={() => handleToggleChannel('betaChannel')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="devChannel">Dev Channel</Label>
                <p className="text-sm text-muted-foreground">
                  Development builds for early testing.
                </p>
              </div>
              <Switch
                id="devChannel"
                checked={settings.devChannel}
                onCheckedChange={() => handleToggleChannel('devChannel')}
              />
            </div>
            <Button 
              className="w-full mt-6" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}