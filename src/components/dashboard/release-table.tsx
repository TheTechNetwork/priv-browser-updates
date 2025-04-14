import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download, Eye, XCircle } from "lucide-react";
import type { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";

interface ReleaseTableProps {
  releases: Schema["releases"][];
  onRefresh: () => void;
}

export function ReleaseTable({ releases, onRefresh }: ReleaseTableProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getChannelBadge = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "stable":
        return <Badge className="bg-green-500">Stable</Badge>;
      case "beta":
        return <Badge className="bg-blue-500">Beta</Badge>;
      case "dev":
        return <Badge className="bg-amber-500">Dev</Badge>;
      default:
        return <Badge>{channel}</Badge>;
    }
  };

  const toggleReleaseStatus = async (release: Schema["releases"]) => {
    try {
      setIsLoading(true);
      await fine.table("releases")
        .update({ isActive: !release.isActive })
        .eq("id", release.id)
        .select();
      onRefresh();
    } catch (error) {
      console.error("Failed to update release status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Released</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No releases found
              </TableCell>
            </TableRow>
          ) : (
            releases.map((release) => (
              <TableRow key={release.id}>
                <TableCell className="font-medium">{release.version}</TableCell>
                <TableCell>{getChannelBadge(release.channel)}</TableCell>
                <TableCell>{release.platform}</TableCell>
                <TableCell>{formatFileSize(release.fileSize)}</TableCell>
                <TableCell>{formatDate(release.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={release.isActive ? "default" : "outline"}>
                    {release.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(release.downloadUrl, "_blank")}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleReleaseStatus(release)}>
                        {release.isActive ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}