import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Download } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { Schema } from "@/lib/db-types";

const Logs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<Schema["updateRequests"][]>([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    platform: "",
    channel: "",
  });
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: "Failed to load logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      const data = await apiClient.exportLogs(filters);
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'update-logs.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export logs:", error);
      toast({
        title: "Error",
        description: "Failed to export logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Logs</h1>
            <p className="text-muted-foreground">
              View and analyze update request logs.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
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
          <Card className="p-6">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Version</th>
                  <th className="pb-2">Platform</th>
                  <th className="pb-2">Channel</th>
                  <th className="pb-2">IP</th>
                  <th className="pb-2">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2">{log.clientVersion || '-'}</td>
                    <td className="py-2">{log.platform || '-'}</td>
                    <td className="py-2">{log.channel || '-'}</td>
                    <td className="py-2">{log.ip || '-'}</td>
                    <td className="py-2 truncate max-w-xs" title={log.userAgent}>
                      {log.userAgent || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Logs;