// This is a simplified version of the update service for the worker
// It contains the core functionality needed for the worker

export class UpdateService {
  private db: D1Database;
  private cache: KVNamespace;

  constructor(db: D1Database, cache: KVNamespace) {
    this.db = db;
    this.cache = cache;
  }

  async processUpdateRequest(request: {
    version: string;
    platform: string;
    channel: string;
    ip: string;
    userAgent: string;
  }): Promise<string> {
    // Log the update request
    await this.logUpdateRequest(request);
    
    // Get the latest version for the requested platform and channel
    const latestRelease = await this.getLatestVersion(request.platform, request.channel);
    
    // Generate and return the update XML
    return this.generateUpdateXml(latestRelease, request);
  }

  private async logUpdateRequest(request: {
    version: string;
    platform: string;
    channel: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    await this.db.prepare(`
      INSERT INTO updateRequests (clientVersion, platform, channel, ip, userAgent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      request.version,
      request.platform,
      request.channel,
      request.ip,
      request.userAgent
    ).run();
  }

  private async getLatestVersion(platform: string, channel: string): Promise<any | null> {
    // Try to get from cache first
    const cacheKey = `release:${platform}:${channel}`;
    const cachedRelease = await this.cache.get(cacheKey, 'json');
    
    if (cachedRelease) {
      return cachedRelease;
    }
    
    // If not in cache, get from database
    const releases = await this.db.prepare(`
      SELECT * FROM releases
      WHERE platform = ?
      AND channel = ?
      AND isActive = 1
      ORDER BY id DESC
      LIMIT 1
    `).bind(platform, channel).all();
    
    if (releases.results.length === 0) {
      return null;
    }
    
    const release = releases.results[0];
    
    // Store in cache for 1 hour
    await this.cache.put(cacheKey, JSON.stringify(release), {
      expirationTtl: 3600 // 1 hour in seconds
    });
    
    return release;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(part => parseInt(part, 10) || 0);
    const parts2 = v2.split('.').map(part => parseInt(part, 10) || 0);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  private generateUpdateXml(release: any | null, request: { version: string }): string {
    // If no update is available or the client is already on the latest version
    if (!release || this.compareVersions(request.version, release.version) >= 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<response protocol="3.0">
  <app appid="chromium">
    <updatecheck status="noupdate"/>
  </app>
</response>`;
    }
    
    // Generate update XML with the new version information
    return `<?xml version="1.0" encoding="UTF-8"?>
<response protocol="3.0">
  <app appid="chromium">
    <updatecheck status="ok">
      <urls>
        <url codebase="${release.downloadUrl}"/>
      </urls>
      <manifest version="${release.version}">
        <packages>
          <package name="chromium-${release.version}" hash_sha256="${release.sha256 || ''}" size="${release.fileSize || 0}" required="true"/>
        </packages>
      </manifest>
    </updatecheck>
  </app>
</response>`;
  }
}