import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface ConfigFormProps {
  initialConfig: Record<string, string>;
  onSaved: () => void;
}

export function ConfigForm({ initialConfig, onSaved }: ConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const { toast } = useToast();

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.updateConfig(config);
      toast({
        title: "Success",
        description: "Configuration saved successfully.",
      });
      onSaved();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Configure GitHub repository settings for release synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="githubOwner">Repository Owner</Label>
            <Input
              id="githubOwner"
              value={config.githubOwner || ""}
              onChange={(e) => handleChange("githubOwner", e.target.value)}
              placeholder="e.g., microsoft"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubRepo">Repository Name</Label>
            <Input
              id="githubRepo"
              value={config.githubRepo || ""}
              onChange={(e) => handleChange("githubRepo", e.target.value)}
              placeholder="e.g., chromium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubToken">GitHub Token</Label>
            <Input
              id="githubToken"
              type="password"
              value={config.githubToken || ""}
              onChange={(e) => handleChange("githubToken", e.target.value)}
              placeholder="GitHub Personal Access Token"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cacheDuration">Cache Duration (seconds)</Label>
            <Input
              id="cacheDuration"
              type="number"
              value={config.cacheDuration || "3600"}
              onChange={(e) => handleChange("cacheDuration", e.target.value)}
              min="60"
              max="86400"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}