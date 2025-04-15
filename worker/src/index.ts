import { createRateLimiter } from './utils/rate-limiter';
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
  ALLOWED_ORIGINS: string;
  AUTH_RATE_LIMIT: string;
  API_RATE_LIMIT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Create rate limiters
    const authRateLimiter = createRateLimiter({
      limit: parseInt(env.AUTH_RATE_LIMIT || '10'),
      window: 60, // 1 minute window
      keyPrefix: 'auth_rate_limit',
      kv: env.CACHE
    });
    
    const apiRateLimiter = createRateLimiter({
      limit: parseInt(env.API_RATE_LIMIT || '100'),
      window: 60, // 1 minute window
      keyPrefix: 'api_rate_limit',
      kv: env.CACHE
    });
    
    // Create update service
    const updateService = new UpdateService(env.DB, env.CACHE);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(request, env);
    }
    
    // Handle update requests
    if (url.pathname === '/update') {
      return updateService.handleUpdateRequest(request);
    }
    
    // Handle authentication endpoints
    if (url.pathname.startsWith('/auth/')) {
      // Apply rate limiting to auth endpoints
      const rateLimitResult = await authRateLimiter.limit(request);
      if (!rateLimitResult.success) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      
      return handleAuthRequest(request, url, env);
    }
    
    // Handle API requests (for admin dashboard)
    if (url.pathname.startsWith('/api/')) {
      // Apply rate limiting to API endpoints
      const rateLimitResult = await apiRateLimiter.limit(request);
      if (!rateLimitResult.success) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
      
      return handleApiRequest(request, url, env);
    }
    
    // Return 404 for any other paths
    return new Response('Not found', { status: 404 });
  }
};

// Handle CORS preflight requests
function handleCorsPreflightRequest(request: Request, env: Env): Response {
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
  const origin = request.headers.get('Origin') || '';
  
  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  
  if (!isAllowedOrigin) {
    return new Response('Not allowed', { status: 403 });
  }
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle authentication requests
async function handleAuthRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // GitHub OAuth flow
  if (url.pathname === '/auth/github/login') {
    // Generate a random state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Store the state in KV for validation later
    await env.SESSION_STORE.put(`github_state:${state}`, 'true', { expirationTtl: 600 }); // 10 minutes
    
    // Redirect to GitHub OAuth
    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    redirectUrl.searchParams.set('redirect_uri', `${url.origin}/auth/github/callback`);
    redirectUrl.searchParams.set('state', state);
    redirectUrl.searchParams.set('scope', 'read:user');
    
    return Response.redirect(redirectUrl.toString(), 302);
  }
  
  if (url.pathname === '/auth/github/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code || !state) {
      return new Response('Missing code or state parameter', { status: 400 });
    }
    
    // Verify the state parameter to prevent CSRF attacks
    const storedState = await env.SESSION_STORE.get(`github_state:${state}`);
    if (!storedState) {
      return new Response('Invalid state parameter', { status: 400 });
    }
    
    // Delete the state to prevent replay attacks
    await env.SESSION_STORE.delete(`github_state:${state}`);
    
    try {
      // Exchange the code for an access token
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
          redirect_uri: `${url.origin}/auth/github/callback`,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error('GitHub OAuth error:', tokenData.error);
        return new Response(`GitHub OAuth error: ${tokenData.error}`, { status: 400 });
      }
      
      const accessToken = tokenData.access_token;
      
      // Get the user's GitHub profile
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'Browser-Update-Server',
        },
      });
      
      const userData = await userResponse.json();
      
      // Check if the user is allowed to access admin features
      const allowedAdminUsers = env.ALLOWED_ADMIN_USERS ? env.ALLOWED_ADMIN_USERS.split(',') : [];
      const isAdmin = allowedAdminUsers.includes(userData.login);
      
      // Create a session
      const sessionId = crypto.randomUUID();
      const sessionData = {
        id: sessionId,
        user_id: userData.id.toString(),
        user_login: userData.login,
        user_name: userData.name || userData.login,
        user_avatar: userData.avatar_url,
        is_admin: isAdmin ? 1 : 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      
      // Store the session in KV
      await env.SESSION_STORE.put(`session:${sessionId}`, JSON.stringify(sessionData), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
      });
      
      // Store the session in the database for audit purposes
      await env.DB.prepare(`
        INSERT INTO sessions (id, user_id, user_login, user_name, user_avatar, is_admin, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId,
        sessionData.user_id,
        sessionData.user_login,
        sessionData.user_name,
        sessionData.user_avatar,
        sessionData.is_admin,
        sessionData.created_at,
        sessionData.expires_at
      ).run();
      
      // Log the authentication event
      await env.DB.prepare(`
        INSERT INTO auditLogs (event_type, user_id, ip_address, details)
        VALUES (?, ?, ?, ?)
      `).bind(
        'login',
        sessionData.user_id,
        request.headers.get('CF-Connecting-IP') || '',
        JSON.stringify({ method: 'github_oauth' })
      ).run();
      
      // Set the session cookie
      const cookie = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
      
      // Redirect to the dashboard
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': cookie,
        },
      });
    } catch (error) {
      console.error('Error during GitHub OAuth:', error);
      return new Response('Error during GitHub OAuth', { status: 500 });
    }
  }
  
  if (url.pathname === '/auth/logout') {
    // Get the session cookie
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    
    if (sessionCookie) {
      const sessionId = sessionCookie.split('=')[1].trim();
      
      // Delete the session from KV
      await env.SESSION_STORE.delete(`session:${sessionId}`);
      
      // Log the logout event
      const sessionData = await env.SESSION_STORE.get(`session:${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        await env.DB.prepare(`
          INSERT INTO auditLogs (event_type, user_id, ip_address, details)
          VALUES (?, ?, ?, ?)
        `).bind(
          'logout',
          session.user_id,
          request.headers.get('CF-Connecting-IP') || '',
          JSON.stringify({ method: 'explicit_logout' })
        ).run();
      }
    }
    
    // Clear the session cookie
    const clearCookie = 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
    
    // Redirect to the home page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': clearCookie,
      },
    });
  }
  
  return new Response('Auth endpoint not found', { status: 404 });
}

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // Get the session cookie
  const cookies = request.headers.get('Cookie') || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
  
  if (!sessionCookie) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const sessionId = sessionCookie.split('=')[1].trim();
  const sessionData = await env.SESSION_STORE.get(`session:${sessionId}`);
  
  if (!sessionData) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const session = JSON.parse(sessionData);
  
  // Check if the session has expired
  if (new Date(session.expires_at) < new Date()) {
    await env.SESSION_STORE.delete(`session:${sessionId}`);
    return new Response('Session expired', { status: 401 });
  }
  
  // For admin endpoints, check if the user is an admin
  if (url.pathname.startsWith('/api/admin/') && !session.is_admin) {
    // Log unauthorized access attempt
    await env.DB.prepare(`
      INSERT INTO auditLogs (event_type, user_id, ip_address, details)
      VALUES (?, ?, ?, ?)
    `).bind(
      'unauthorized_access',
      session.user_id,
      request.headers.get('CF-Connecting-IP') || '',
      JSON.stringify({ endpoint: url.pathname })
    ).run();
    
    return new Response('Forbidden', { status: 403 });
  }
  
  // Handle API endpoints
  if (url.pathname === '/api/user') {
    // Return the user's profile
    return new Response(JSON.stringify({
      id: session.user_id,
      login: session.user_login,
      name: session.user_name,
      avatar: session.user_avatar,
      is_admin: session.is_admin === 1,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
  
  // Admin endpoints
  if (url.pathname === '/api/admin/config' && request.method === 'GET') {
    // Get all configuration values
    const configs = await env.DB.prepare('SELECT * FROM configurations').all();
    return new Response(JSON.stringify(configs.results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
  
  if (url.pathname === '/api/admin/config' && request.method === 'POST') {
    try {
      const data = await request.json();
      
      // Update each configuration value
      for (const [key, value] of Object.entries(data)) {
        await env.DB.prepare(`
          UPDATE configurations
          SET value = ?, updated_at = ?, updated_by = ?
          WHERE key = ?
        `).bind(
          String(value),
          new Date().toISOString(),
          session.user_login,
          key
        ).run();
      }
      
      // Log the configuration update
      await env.DB.prepare(`
        INSERT INTO auditLogs (event_type, user_id, ip_address, details)
        VALUES (?, ?, ?, ?)
      `).bind(
        'config_update',
        session.user_id,
        request.headers.get('CF-Connecting-IP') || '',
        JSON.stringify(data)
      ).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      return new Response(JSON.stringify({ error: 'Failed to update configuration' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
  }
  
  if (url.pathname === '/api/admin/releases' && request.method === 'GET') {
    const releases = await env.DB.prepare('SELECT * FROM releases ORDER BY id DESC').all();
    return new Response(JSON.stringify(releases.results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
  
  if (url.pathname === '/api/admin/sync' && request.method === 'POST') {
    // Trigger a sync with GitHub
    try {
      const updateService = new UpdateService(env.DB, env.CACHE);
      await updateService.syncReleasesFromGitHub();
      
      // Log the sync event
      await env.DB.prepare(`
        INSERT INTO auditLogs (event_type, user_id, ip_address, details)
        VALUES (?, ?, ?, ?)
      `).bind(
        'github_sync',
        session.user_id,
        request.headers.get('CF-Connecting-IP') || '',
        '{}'
      ).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    } catch (error) {
      console.error('Error syncing with GitHub:', error);
      return new Response(JSON.stringify({ error: 'Failed to sync with GitHub' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
  }
  
  if (url.pathname === '/api/admin/audit-logs' && request.method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    const logs = await env.DB.prepare(`
      SELECT * FROM auditLogs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM auditLogs').first();
    
    return new Response(JSON.stringify({
      logs: logs.results,
      total: count ? count.count : 0,
      page,
      limit,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
  
  return new Response('API endpoint not found', { 
    status: 404,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || '',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
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