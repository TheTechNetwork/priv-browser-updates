import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SecureInput } from "@/components/auth/secure-input";
import { encryptToken, decryptToken, isValidGithubToken } from "@/lib/secure-token";

interface ConfigFormProps {
  initialConfig: Record<string, string>;
  onSaved: () => void;
}

export function ConfigForm({ initialConfig, onSaved }: ConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      githubOwner: initialConfig.githubOwner || "",
      githubRepo: initialConfig.githubRepo || "",
      githubToken: initialConfig.githubToken || "",
      cacheDuration: initialConfig.cacheDuration || "3600",
      stableChannel: initialConfig.stableChannel === "true",
      betaChannel: initialConfig.betaChannel === "true",
      devChannel: initialConfig.devChannel === "true",
    }
  });
  
  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      // Validate GitHub token if provided
      if (data.githubToken && !isValidGithubToken(data.githubToken)) {
        toast({
          title: "Invalid GitHub Token",
          description: "The GitHub token format appears to be invalid. Please check and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Convert boolean values to strings and encrypt sensitive data
      const configData = {
        ...data,
        // Encrypt GitHub token before storing
        githubToken: data.githubToken ? encryptToken(data.githubToken) : "",
        stableChannel: data.stableChannel ? "true" : "false",
        betaChannel: data.betaChannel ? "true" : "false",
        devChannel: data.devChannel ? "true" : "false",
      };
      
      // Get the authentication token
      const authToken = localStorage.getItem('github_auth_token');
      if (!authToken) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save settings.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Save to Cloudflare backend
      const response = await fetch(`${window.location.origin}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(configData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
      
      // Also save to localStorage as a fallback
      localStorage.setItem('app_config', JSON.stringify(configData));
      
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
      
      onSaved();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast({
        title: "Error",
        description: typeof error === 'object' && error instanceof Error 
          ? error.message 
          : "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>GitHub Repository Settings</CardTitle>
          <CardDescription>
            Configure the GitHub repository where your Chromium builds are published.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="githubOwner">Repository Owner</Label>
              <Input
                id="githubOwner"
                placeholder="e.g., username or organization"
                {...register("githubOwner", { required: "Repository owner is required" })}
              />
              {errors.githubOwner && (
                <p className="text-sm text-destructive">{errors.githubOwner.message as string}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="githubRepo">Repository Name</Label>
              <Input
                id="githubRepo"
                placeholder="e.g., chromium-fork"
                {...register("githubRepo", { required: "Repository name is required" })}
              />
              {errors.githubRepo && (
                <p className="text-sm text-destructive">{errors.githubRepo.message as string}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="githubToken">GitHub API Token (Optional)</Label>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <Controller
              name="githubToken"
              control={control}
              render={({ field }) => (
                <SecureInput
                  id="githubToken"
                  placeholder="Personal access token for private repositories"
                  value={field.value}
                  onChange={field.onChange}
                  name={field.name}
                  disabled={isLoading}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Only required for private repositories or to increase API rate limits.
              <br />
              <span className="text-amber-500">Security note: Use tokens with minimal permissions (read-only access).</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cacheDuration">Cache Duration (seconds)</Label>
            <Input
              id="cacheDuration"
              type="number"
              {...register("cacheDuration", { 
                required: "Cache duration is required",
                min: { value: 60, message: "Minimum cache duration is 60 seconds" }
              })}
            />
            {errors.cacheDuration && (
              <p className="text-sm text-destructive">{errors.cacheDuration.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              How long to cache GitHub API responses (in seconds).
            </p>
          </div>
        </CardContent>
        
        <CardHeader className="border-t pt-6">
          <CardTitle>Channel Settings</CardTitle>
          <CardDescription>
            Configure which update channels are enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stableChannel">Stable Channel</Label>
              <p className="text-sm text-muted-foreground">
                Serve updates for stable channel clients
              </p>
            </div>
            <Switch
              id="stableChannel"
              {...register("stableChannel")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="betaChannel">Beta Channel</Label>
              <p className="text-sm text-muted-foreground">
                Serve updates for beta channel clients
              </p>
            </div>
            <Switch
              id="betaChannel"
              {...register("betaChannel")}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="devChannel">Dev Channel</Label>
              <p className="text-sm text-muted-foreground">
                Serve updates for dev channel clients
              </p>
            </div>
            <Switch
              id="devChannel"
              {...register("devChannel")}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}