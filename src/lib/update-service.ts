import { fine } from "./fine";
import { compareVersions } from "./github";
import type { Schema } from "./db-types";

interface UpdateRequest {
  version: string;
  platform: string;
  channel: string;
  userAgent: string;
  ip: string;
}

export async function logUpdateRequest(request: UpdateRequest): Promise<void> {
  await fine.table("updateRequests").insert({
    clientVersion: request.version,
    platform: request.platform,
    channel: request.channel,
    userAgent: request.userAgent,
    ip: request.ip
  });
}

export async function getLatestVersion(platform: string, channel: string): Promise<Schema["releases"] | null> {
  const releases = await fine.table("releases")
    .select()
    .eq("platform", platform)
    .eq("channel", channel)
    .eq("isActive", true);
  
  if (releases.length === 0) {
    return null;
  }
  
  // Find the release with the highest version number
  return releases.reduce((latest, current) => {
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

export async function processUpdateRequest(request: UpdateRequest): Promise<string> {
  // Log the update request
  await logUpdateRequest(request);
  
  // Get the latest version for the requested platform and channel
  const latestRelease = await getLatestVersion(request.platform, request.channel);
  
  // Generate and return the update XML
  return generateUpdateXml(latestRelease, request);
}