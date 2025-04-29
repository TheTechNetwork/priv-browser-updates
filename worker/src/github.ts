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

export async function fetchGitHubReleases(env: {
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
}): Promise<GitHubRelease[]> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Browser Update Service",
  };
  
  if (env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

export async function syncReleasesToDatabase(releases: GitHubRelease[], db: D1Database): Promise<void> {
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
      if (release.name?.toLowerCase().includes("beta") || release.tag_name.toLowerCase().includes("beta")) {
        channel = "beta";
      } else if (release.name?.toLowerCase().includes("dev") || release.tag_name.toLowerCase().includes("dev")) {
        channel = "dev";
      }
      
      // Insert or update release in database
      await db.prepare(`
        INSERT INTO releases (version, channel, platform, downloadUrl, releaseNotes, fileSize, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (version, platform, channel) 
        DO UPDATE SET
          downloadUrl = excluded.downloadUrl,
          releaseNotes = excluded.releaseNotes,
          fileSize = excluded.fileSize,
          isActive = excluded.isActive
      `).bind(
        version,
        channel,
        platform,
        asset.browser_download_url,
        release.body || '',
        asset.size,
        true
      ).run();
    }
  }
} 