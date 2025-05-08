import { apiClient } from './api';

export interface Release {
  version: string;
  channel: string;
  platform: string;
  downloadUrl: string;
  releaseNotes?: string;
  fileSize?: number;
  isActive: boolean;
}

// The frontend only needs to know about releases, not GitHub specifics
export async function getReleases(): Promise<Release[]> {
  const { data } = await apiClient.get<{ results: Release[] }>('/api/releases');
  return data.results;
}

export async function syncReleases(): Promise<void> {
  await apiClient.post('/api/releases/sync', {});
}

export function parseVersionString(version: string): number[] {
  return version.split('.').map(part => parseInt(part, 10) || 0);
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersionString(v1);
  const parts2 = parseVersionString(v2);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}