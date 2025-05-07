import React from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";
import { StatsCard } from "./stats-card";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Define the stats type
interface Stats {
  totalReleases: number;
  activeReleases: number;
  totalDownloads: number;
  platforms: { win: number; mac: number; linux: number };
  channels: { stable: number; beta: number; dev: number };
  downloadsTrend: { date: string; count: number }[];
}

export function DashboardStatsCard() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: apiClient.getStats,
    refetchInterval: REFRESH_INTERVAL,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Error loading statistics</p>
        </CardContent>
      </Card>
    );
  }

  // Format numbers
  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Releases" value={stats?.totalReleases ?? 0} description="Total releases in the system" />
        <StatsCard title="Active Releases" value={`${stats?.activeReleases ?? 0}%`} description="Percentage of active releases" />
        <StatsCard title="Total Downloads" value={formatNumber(stats?.totalDownloads ?? 0)} description="Total downloads across all releases" />
      </div>

      {/* Platform Distribution Chart */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Platform Distribution</h3>
          <div data-testid="platform-chart" style={{ aspectRatio: 1 }}>
            <Chart config={{ win: { label: "Windows", color: "#2563eb" }, mac: { label: "Mac", color: "#64748b" }, linux: { label: "Linux", color: "#16a34a" } }}>
              {/* Replace with actual chart implementation, e.g. PieChart */}
              <div>
                <span data-testid="platform-win-segment">Windows: {stats?.platforms?.win ?? 0}%</span>
                <span>Mac: {stats?.platforms?.mac ?? 0}%</span>
                <span>Linux: {stats?.platforms?.linux ?? 0}%</span>
              </div>
            </Chart>
          </div>
        </CardContent>
      </Card>

      {/* Channel Distribution Chart */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Channel Distribution</h3>
          <div data-testid="channel-chart" style={{ aspectRatio: 1 }}>
            <Chart config={{ stable: { label: "Stable", color: "#22c55e" }, beta: { label: "Beta", color: "#f59e42" }, dev: { label: "Dev", color: "#ef4444" } }}>
              {/* Replace with actual chart implementation, e.g. PieChart */}
              <div>
                <span>Stable: {stats?.channels?.stable ?? 0}%</span>
                <span>Beta: {stats?.channels?.beta ?? 0}%</span>
                <span>Dev: {stats?.channels?.dev ?? 0}%</span>
              </div>
            </Chart>
          </div>
        </CardContent>
      </Card>

      {/* Downloads Trend Chart */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2">Downloads Trend</h3>
          <div data-testid="downloads-trend-chart" style={{ aspectRatio: 1 }}>
            <Chart config={{ trend: { label: "Downloads", color: "#2563eb" } }}>
              {/* Replace with actual chart implementation, e.g. LineChart */}
              <div>
                {stats?.downloadsTrend?.map((point: any) => (
                  <span key={point.date}>{formatNumber(point.count)}</span>
                ))}
              </div>
            </Chart>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 