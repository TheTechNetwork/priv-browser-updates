import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import type { Schema } from "@/lib/db-types";

const Logs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<Schema["updateRequests"][]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Schema["updateRequests"][]>([]);
  const [filters, setFilters] = useState({
    version: "",
    platform: "",
    channel: "",
  });
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const logsData = await fine.table("updateRequests")
        .select()
        .order("timestamp", { ascending: false })
        .limit(100);
      
      setLogs(logsData);
      setFilteredLogs(logsData);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: "Failed to load update request logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    if (filters.version) {
      filtered = filtered.filter(log => 
        log.clientVersion?.toLowerCase().includes(filters.version.toLowerCase())
      );
    }
    
    if (filters.platform) {
      filtered = filtered.filter(log => 
        log.platform === filters.platform
      );
    }
    
    if (filters.channel) {
      filtered = filtered.filter(log => 
        log.channel === filters.channel
      );
    }
    
    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Client Version", "Platform", "Channel", "IP Address", "User Agent"].join(","),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.clientVersion || "",
        log.platform || "",
        log.channel || "",
        log.ip || "",
        `"${log.userAgent?.replace(/"/g, '""') || ""}"`
      ].join(","))
    ].join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `update-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, logs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Update Logs</h1>
            <p className="text-muted-foreground">
              View and analyze client update requests.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportLogs} disabled={isLoading || filteredLogs.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Client Version</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No update requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.clientVersion || "Unknown"}</TableCell>
                      <TableCell>{log.platform || "Unknown"}</TableCell>
                      <TableCell>{log.channel || "Unknown"}</TableCell>
                      <TableCell>{log.ip || "Unknown"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Logs;