import apiClient from "./api-client";

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
}

interface Config {
  githubOwner: string;
  githubRepo: string;
  githubToken: string;
  cacheDuration: number;
}

// Cache for GitHub releases
let releasesCache: {
  data: GitHubRelease[];
  timestamp: number;
} | null = null;

export async function getConfig(): Promise<Config> {
  const { data } = await apiClient.getConfig();
  return {
    githubOwner: data.githubOwner || "",
    githubRepo: data.githubRepo || "",
    githubToken: data.githubToken || "",
    cacheDuration: parseInt(data.cacheDuration || "3600", 10),
  };
}

export async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  const config = await getConfig();
  
  // Check if we have a valid cache
  if (releasesCache && 
      (Date.now() - releasesCache.timestamp) < config.cacheDuration * 1000) {
    return releasesCache.data;
  }
  
  // No valid cache, fetch from GitHub
  if (!config.githubOwner || !config.githubRepo) {
    throw new Error("GitHub repository configuration is missing");
  }
  
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  
  if (config.githubToken) {
    headers["Authorization"] = `token ${config.githubToken}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/releases`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
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
  const releases = await fetchGitHubReleases();
  
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