import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ReleaseTable } from "@/components/dashboard/release-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, GitPullRequest } from "lucide-react";
import { fine } from "@/lib/fine";
import { syncReleasesToDatabase } from "@/lib/github";
import { useToast } from "@/hooks/use-toast";
import type { Schema } from "@/lib/db-types";

const Releases = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [releases, setReleases] = useState<Schema["releases"][]>([]);
  const [filteredReleases, setFilteredReleases] = useState<Schema["releases"][]>([]);
  const [filters, setFilters] = useState({
    version: "",
    platform: "",
    channel: "",
  });
  const { toast } = useToast();

  const fetchReleases = async () => {
    try {
      setIsLoading(true);
      const releasesData = await fine.table("releases").select();
      setReleases(releasesData);
      setFilteredReleases(releasesData);
    } catch (error) {
      console.error("Failed to fetch releases:", error);
      toast({
        title: "Error",
        description: "Failed to load releases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncReleasesToDatabase();
      toast({
        title: "Sync completed",
        description: "Successfully synchronized releases from GitHub.",
      });
      fetchReleases();
    } catch (error: any) {
      console.error("Failed to sync releases:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to synchronize releases from GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...releases];
    
    if (filters.version) {
      filtered = filtered.filter(release => 
        release.version.toLowerCase().includes(filters.version.toLowerCase())
      );
    }
    
    if (filters.platform) {
      filtered = filtered.filter(release => 
        release.platform === filters.platform
      );
    }
    
    if (filters.channel) {
      filtered = filtered.filter(release => 
        release.channel === filters.channel
      );
    }
    
    setFilteredReleases(filtered);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, releases]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
            <p className="text-muted-foreground">
              Manage and monitor all Chromium releases.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={fetchReleases} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Sync Releases
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              placeholder="Filter by version..."
              value={filters.version}
              onChange={(e) => handleFilterChange("version", e.target.value)}
            />
          </div>
          <div>
            <Select
              value={filters.platform}
              onValueChange={(value) => handleFilterChange("platform", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by platform..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Platforms</SelectItem>
                <SelectItem value="win">Windows</SelectItem>
                <SelectItem value="mac">macOS</SelectItem>
                <SelectItem value="linux">Linux</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.channel}
              onValueChange={(value) => handleFilterChange("channel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by channel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Channels</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="dev">Dev</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ReleaseTable releases={filteredReleases} onRefresh={fetchReleases} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Releases;