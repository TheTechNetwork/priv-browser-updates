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
import { formatDistanceToNow } from "date-fns";
import type { Schema } from "@/lib/db-types";

type Release = Schema['releases'];

interface ReleaseTableProps {
  releases: Release[];
  onToggleStatus: (release: Release) => void;
}

export function ReleaseTable({ releases, onToggleStatus }: ReleaseTableProps) {
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "N/A";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getChannelBadge = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "stable":
        return <Badge variant="default">{channel}</Badge>;
      case "beta":
        return <Badge variant="secondary">{channel}</Badge>;
      case "alpha":
        return <Badge variant="destructive">{channel}</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>File Size</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {releases.map((release) => (
          <TableRow key={release.id}>
            <TableCell>{release.version}</TableCell>
            <TableCell>{getChannelBadge(release.channel)}</TableCell>
            <TableCell className="capitalize">{release.platform}</TableCell>
            <TableCell>{formatFileSize(release.fileSize)}</TableCell>
            <TableCell>
              {release.createdAt
                ? formatDistanceToNow(new Date(release.createdAt), {
                    addSuffix: true,
                  })
                : "N/A"}
            </TableCell>
            <TableCell>
              <Badge
                variant={release.isActive ? "default" : "secondary"}
                className="cursor-default"
              >
                {release.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {release.downloadUrl && (
                    <DropdownMenuItem asChild>
                      <a
                        href={release.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </DropdownMenuItem>
                  )}
                  {release.releaseNotes && (
                    <DropdownMenuItem
                      onClick={() => {
                        // TODO: Implement release notes modal
                        console.log("View release notes:", release.releaseNotes);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Release Notes
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onToggleStatus(release)}
                    className="flex items-center"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {release.isActive ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}