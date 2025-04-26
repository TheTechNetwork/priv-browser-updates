// This is a simplified version of the update service for the worker
// It contains the core functionality needed for the worker

interface UpdateRequest {
  version: string;
  platform: string;
  channel: string;
  ip: string;
  userAgent: string;
}

interface Release {
  version: string;
  downloadUrl: string;
  sha256?: string;
  fileSize?: number;
}

export async function processUpdateRequest(request: UpdateRequest, db: D1Database): Promise<string> {
  // Log the update request
  await logUpdateRequest(request, db);
  
  // Get the latest version for the platform and channel
  const latestRelease = await getLatestVersion(request.platform, request.channel, db);
  
  // Generate and return the update XML
  return generateUpdateXml(latestRelease, request);
}

export async function logUpdateRequest(request: UpdateRequest, db: D1Database): Promise<void> {
  await db.prepare(`
    INSERT INTO updateRequests (version, platform, channel, ip, userAgent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    request.version,
    request.platform,
    request.channel,
    request.ip,
    request.userAgent
  ).run();
}

async function getLatestVersion(platform: string, channel: string, db: D1Database): Promise<Release | null> {
  const releases = await db.prepare(`
    SELECT version, downloadUrl, sha256, fileSize FROM releases
    WHERE platform = ?
    AND channel = ?
    AND isActive = 1
    ORDER BY id DESC
    LIMIT 1
  `).bind(platform, channel).all();
  
  if (releases.results.length === 0) {
    return null;
  }
  
  const result = releases.results[0];
  return {
    version: result.version as string,
    downloadUrl: result.downloadUrl as string,
    sha256: result.sha256 as string | undefined,
    fileSize: result.fileSize as number | undefined
  };
}

function compareVersions(v1: string, v2: string): number {
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

function generateUpdateXml(release: Release | null, request: { version: string }): string {
  // If no update is available or the client is already on the latest version
  if (!release || compareVersions(request.version, release.version) >= 0) {
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