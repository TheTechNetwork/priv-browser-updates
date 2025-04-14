import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ReleaseTable } from "@/components/dashboard/release-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, Users, GitPullRequest, Server } from "lucide-react";
import { fine } from "@/lib/fine";
import { syncReleasesToDatabase } from "@/lib/github";
import { useToast } from "@/hooks/use-toast";
import type { Schema } from "@/lib/db-types";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalReleases: 0,
    activeReleases: 0,
    totalRequests: 0,
    lastUpdateCheck: "Never"
  });
  const [releases, setReleases] = useState<Schema["releases"][]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch releases
      const releasesData = await fine.table("releases").select();
      setReleases(releasesData);
      
      // Calculate stats
      const activeReleases = releasesData.filter(r => r.isActive).length;
      
      // Get total update requests - fixed query
      const requestsCount = await fine.table("updateRequests").select();
      const totalRequests = requestsCount.length;
      
      // Get latest request timestamp
      const latestRequest = await fine.table("updateRequests")
        .select("timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);
      
      const lastUpdateCheck = latestRequest.length > 0 
        ? new Date(latestRequest[0].timestamp!).toLocaleString()
        : "Never";
      
      setStats({
        totalReleases: releasesData.length,
        activeReleases,
        totalRequests,
        lastUpdateCheck
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
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
      fetchData();
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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your Chromium update server and manage releases.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatsCard
                title="Total Releases"
                value={stats.totalReleases}
                icon={<Download className="h-4 w-4" />}
              />
              <StatsCard
                title="Active Releases"
                value={stats.activeReleases}
                icon={<Server className="h-4 w-4" />}
              />
              <StatsCard
                title="Update Requests"
                value={stats.totalRequests}
                icon={<Users className="h-4 w-4" />}
              />
              <StatsCard
                title="Last Update Check"
                value={stats.lastUpdateCheck}
                icon={<RefreshCw className="h-4 w-4" />}
              />
            </div>

            <Tabs defaultValue="all" className="mb-8">
              <TabsList>
                <TabsTrigger value="all">All Releases</TabsTrigger>
                <TabsTrigger value="active">Active Releases</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <ReleaseTable 
                  releases={releases} 
                  onRefresh={fetchData} 
                />
              </TabsContent>
              <TabsContent value="active" className="mt-4">
                <ReleaseTable 
                  releases={releases.filter(r => r.isActive)} 
                  onRefresh={fetchData} 
                />
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Update Server Endpoint</CardTitle>
                <CardDescription>
                  Use this URL in your Chromium fork to receive updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  https://your-cloudflare-worker.workers.dev/update
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure your Chromium fork to send update requests to this endpoint.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;