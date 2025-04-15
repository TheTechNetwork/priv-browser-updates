import { createRateLimiter } from './rate-limiter';
import { UpdateService } from './update-service';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION_STORE: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  ALLOWED_ADMIN_USERS: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };
    
    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    
    // Apply rate limiting to API requests
    if (url.pathname.startsWith('/api/')) {
      const rateLimiter = createRateLimiter(env.CACHE, 60, 60 * 1000); // 60 requests per minute
      const rateLimitResponse = await rateLimiter(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    
    // Handle update requests
    if (url.pathname === '/update') {
      return handleUpdateRequest(request, env);
    }
    
    // Handle API requests (for admin dashboard)
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApiRequest(request, url, env);
      
      // Add CORS headers to the response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    
    // Return 404 for any other paths
    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders
    });
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
    
    // Create update service instance
    const updateService = new UpdateService(env.DB, env.CACHE);
    
    // Process the update request
    const updateXml = await updateService.processUpdateRequest({
      version,
      platform,
      channel,
      ip,
      userAgent
    });
    
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
  // Authentication endpoints don't require authentication
  if (url.pathname.startsWith('/api/auth/')) {
    return handleAuthRequest(request, url, env);
  }
  
  // All other API endpoints require authentication
  const authResult = await authenticateRequest(request, env);
  
  if (!authResult.authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Configuration endpoints require admin access
  if (url.pathname.startsWith('/api/config')) {
    // Check if user is admin
    if (!authResult.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return handleConfigRequest(request, url, env, authResult.user);
  }
  
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
  
  return new Response(JSON.stringify({ error: 'API endpoint not found' }), { 
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAuthRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // GitHub OAuth configuration endpoint
  if (url.pathname === '/api/auth/config' && request.method === 'GET') {
    return new Response(JSON.stringify({
      clientId: env.GITHUB_CLIENT_ID,
      redirectUri: `${new URL(request.url).origin}/auth/callback`,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // GitHub OAuth callback endpoint
  if (url.pathname === '/api/auth/github' && request.method === 'POST') {
    try {
      const { code } = await request.json();
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error || !tokenData.access_token) {
        return new Response(JSON.stringify({ 
          error: tokenData.error_description || 'Failed to exchange code for token' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get user data from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Browser-Updates-Server',
        },
      });
      
      const userData = await userResponse.json();
      
      if (userResponse.status !== 200) {
        return new Response(JSON.stringify({ error: 'Failed to get user data from GitHub' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Check if user is an admin
      const allowedAdmins = env.ALLOWED_ADMIN_USERS.split(',').map(username => username.trim());
      const isAdmin = allowedAdmins.includes(userData.login);
      
      // Create session token (random UUID)
      const sessionToken = crypto.randomUUID();
      
      // Store session data in KV
      const sessionData = {
        user: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
        },
        github_token: tokenData.access_token,
        created: Date.now(),
        isAdmin,
      };
      
      // Store session in KV with expiry (7 days)
      await env.SESSION_STORE.put(`session:${sessionToken}`, JSON.stringify(sessionData), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days in seconds
      });
      
      // Log authentication event
      await env.DB.prepare(`
        INSERT INTO audit_logs (action, entity, entity_id, user, details, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        'login',
        'user',
        userData.id.toString(),
        userData.login,
        JSON.stringify({ ip: request.headers.get('CF-Connecting-IP') || 'unknown' })
      ).run();
      
      // Return session token and user data
      return new Response(JSON.stringify({
        token: sessionToken,
        user: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
        },
        isAdmin,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in GitHub OAuth callback:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Verify authentication token
  if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
    const authResult = await authenticateRequest(request, env);
    
    return new Response(JSON.stringify({
      authenticated: authResult.authenticated,
      user: authResult.user,
      isAdmin: authResult.isAdmin,
      expiresAt: authResult.expiresAt,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Logout endpoint
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      await env.SESSION_STORE.delete(`session:${token}`);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Auth endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleConfigRequest(
  request: Request, 
  url: URL, 
  env: Env, 
  user: any
): Promise<Response> {
  // Get configuration
  if (request.method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        'SELECT key, value FROM configurations'
      ).all();
      
      const config: Record<string, string> = {};
      for (const row of results) {
        config[row.key] = row.value;
      }
      
      return new Response(JSON.stringify(config), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Update configuration
  if (request.method === 'POST') {
    try {
      const config = await request.json();
      
      // Begin transaction
      const stmt = env.DB.prepare('BEGIN TRANSACTION');
      await stmt.run();
      
      try {
        // Update or insert each configuration value
        for (const [key, value] of Object.entries(config)) {
          if (typeof value !== 'string') continue;
          
          await env.DB.prepare(
            `INSERT INTO configurations (key, value, updated_by, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             updated_by = excluded.updated_by,
             updated_at = excluded.updated_at`
          ).bind(key, value, user.login, new Date().toISOString()).run();
        }
        
        // Commit transaction
        await env.DB.prepare('COMMIT').run();
        
        // Log configuration update
        await env.DB.prepare(`
          INSERT INTO audit_logs (action, entity, entity_id, user, details, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          'update',
          'configuration',
          'global',
          user.login,
          JSON.stringify({ 
            keys: Object.keys(config),
            ip: request.headers.get('CF-Connecting-IP') || 'unknown'
          })
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // Rollback on error
        await env.DB.prepare('ROLLBACK').run();
        throw error;
      }
    } catch (error) {
      console.error('Error saving config:', error);
      return new Response(JSON.stringify({ error: 'Failed to save configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function authenticateRequest(request: Request, env: Env): Promise<{
  authenticated: boolean;
  user?: any;
  isAdmin?: boolean;
  expiresAt?: string;
}> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = await env.SESSION_STORE.get(`session:${token}`);
    if (!payload) {
      return { authenticated: false };
    }

    const session = JSON.parse(payload);
    
    // Check if session is expired (7 days)
    const expiryMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.created > expiryMs) {
      await env.SESSION_STORE.delete(`session:${token}`);
      return { authenticated: false };
    }

    // Check if user is admin
    const allowedAdmins = env.ALLOWED_ADMIN_USERS.split(',').map(username => username.trim());
    const isAdmin = allowedAdmins.includes(session.user.login);

    return {
      authenticated: true,
      user: session.user,
      isAdmin,
      expiresAt: new Date(session.created + expiryMs).toISOString(),
    };
  } catch (error) {
    console.error('Error authenticating request:', error);
    return { authenticated: false };
  }
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