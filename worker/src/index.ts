export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle update requests
    if (url.pathname === '/update') {
      return handleUpdateRequest(request, env);
    }
    
    // Handle API requests (for admin dashboard)
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url, env);
    }
    
    // Return 404 for any other paths
    return new Response('Not found', { status: 404 });
  }
};

async function handleUpdateRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const version = url.searchParams.get('version') || '';
    const platform = url.searchParams.get('platform') || '';
    const channel = url.searchParams.get('channel') || 'stable';
    
    // Get client IP and user agent
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Log the update request
    await logUpdateRequest({
      version,
      platform,
      channel,
      ip,
      userAgent
    }, env.DB);
    
    // Get the latest version for the requested platform and channel
    const latestRelease = await getLatestVersion(platform, channel, env.DB);
    
    // Generate and return the update XML
    const updateXml = generateUpdateXml(latestRelease, { version });
    
    // Return the XML response
    return new Response(updateXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error processing update request:', error);
    return new Response('Error processing update request', { status: 500 });
  }
}

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // This would handle API requests from the admin dashboard
  // For security, these should be authenticated
  
  const apiKey = request.headers.get('X-API-Key');
  // In a real implementation, validate the API key against a stored value
  
  // Example API endpoints
  if (url.pathname === '/api/releases') {
    const releases = await env.DB.prepare('SELECT * FROM releases').all();
    return new Response(JSON.stringify(releases), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname === '/api/sync') {
    // Trigger a sync with GitHub
    // This would be implemented in a real application
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('API endpoint not found', { status: 404 });
}

async function logUpdateRequest(request: {
  version: string;
  platform: string;
  channel: string;
  ip: string;
  userAgent: string;
}, db: D1Database): Promise<void> {
  await db.prepare(`
    INSERT INTO updateRequests (clientVersion, platform, channel, ip, userAgent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    request.version,
    request.platform,
    request.channel,
    request.ip,
    request.userAgent
  ).run();
}

async function getLatestVersion(platform: string, channel: string, db: D1Database): Promise<any | null> {
  const releases = await db.prepare(`
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
  
  return releases.results[0];
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

function generateUpdateXml(release: any | null, request: { version: string }): string {
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