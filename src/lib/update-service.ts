import type { Schema } from "./db-types";
import apiClient from "./api-client";

interface UpdateRequest {
  version?: string;
  platform?: string;
  channel?: string;
  ip?: string;
  userAgent?: string;
}

export async function logUpdateRequest(request: UpdateRequest): Promise<void> {
  await apiClient.createUpdateRequest(request);
}

export async function getLatestVersion(platform: string, channel: string): Promise<Schema["releases"] | null> {
  const releases = await apiClient.getReleases({ platform, channel, isActive: true });
  
  if (releases.length === 0) {
    return null;
  }
  
  // Find the release with the highest version number
  return releases.reduce((latest: Schema["releases"] | null, current: Schema["releases"]) => {
    if (!latest || compareVersions(current.version, latest.version) > 0) {
      return current;
    }
    return latest;
  }, null as Schema["releases"] | null);
}

export function generateUpdateXml(release: Schema["releases"] | null, request: UpdateRequest): string {
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

function compareVersions(v1: string = '', v2: string = ''): number {
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

export async function processUpdateRequest(request: UpdateRequest): Promise<string> {
  // Log the update request
  await logUpdateRequest(request);
  
  // Get the latest version for the requested platform and channel
  const latestRelease = await getLatestVersion(request.platform ?? '', request.channel ?? '');
  
  // Generate and return the update XML
  return generateUpdateXml(latestRelease, request);
}