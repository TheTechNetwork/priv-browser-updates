import { apiClient } from './api';

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Array<{
    id: number;
    name: string;
    size: number;
    browser_download_url: string;
  }>;
}

export interface Config {
  data: {
    version: string;
    platform: string;
    channel: string;
    githubOwner: string;
    githubRepo: string;
    githubToken: string;
    cacheDuration: number;
  };
}

// Cache for GitHub releases
interface ReleasesCache {
  data: GitHubRelease[];
  timestamp: number;
}

let releasesCache: ReleasesCache | null = null;

export async function getConfig(): Promise<Config> {
  const { data } = await apiClient.getConfig();
  return { data };
}

export async function getGitHubReleases(config: Config): Promise<GitHubRelease[]> {
  // Check if we have a valid cache
  if (releasesCache && 
      (Date.now() - releasesCache.timestamp) < config.data.cacheDuration * 1000) {
    return releasesCache.data;
  }
  
  // No valid cache, fetch from GitHub
  if (!config.data.githubOwner || !config.data.githubRepo) {
    throw new Error("GitHub repository configuration is missing");
  }

  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Browser Update Service",
  };
  
  if (config.data.githubToken) {
    headers["Authorization"] = `token ${config.data.githubToken}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${config.data.githubOwner}/${config.data.githubRepo}/releases`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const releases = await response.json() as GitHubRelease[];
  
  // Update cache
  releasesCache = {
    data: releases,
    timestamp: Date.now()
  };

  return releases;
}

export async function syncReleasesToDatabase(): Promise<void> {
  const releases = await getGitHubReleases(await getConfig());
  
  for (const release of releases) {
    // Extract version from tag name (assuming format like v1.2.3)
    const version = release.tag_name.replace(/^v/, '');
    
    // Process each asset (platform-specific builds)
    for (const asset of release.assets) {
      // Determine platform from asset name
      let platform = "unknown";
      if (asset.name.includes("win")) platform = "win";
      else if (asset.name.includes("mac")) platform = "mac";
      else if (asset.name.includes("linux")) platform = "linux";
      
      // Determine channel from release name or tag
      let channel = "stable";
      if (release.name.includes("beta") || release.tag_name.includes("beta")) {
        channel = "beta";
      } else if (release.name.includes("dev") || release.tag_name.includes("dev")) {
        channel = "dev";
      }
      
      // Use the API client to check and create releases
      try {
        await apiClient.createRelease({
          version,
          channel,
          platform,
          downloadUrl: asset.browser_download_url,
          releaseNotes: release.body,
          fileSize: asset.size,
          isActive: true
        });
      } catch (error) {
        console.error(`Failed to create release ${version} for ${platform}:`, error);
      }
    }
  }
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