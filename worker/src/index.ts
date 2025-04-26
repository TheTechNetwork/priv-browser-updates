import { processUpdateRequest } from "./update-service";
import { handleGitHubCallback } from './auth';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export default {
  // ctx is required by Cloudflare Workers runtime but not used in our code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Use ctx.waitUntil for background tasks if needed
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle update requests
    if (path === "/update") {
      const version = url.searchParams.get("version");
      const platform = url.searchParams.get("platform");
      const channel = url.searchParams.get("channel");

      if (!version || !platform || !channel) {
        return new Response("Missing required parameters", { status: 400 });
      }

      // Process the update request
      const updateRequest = {
        version,
        platform,
        channel,
        ip: request.headers.get("cf-connecting-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      };

      try {
        const xml = await processUpdateRequest(updateRequest, env.DB);
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'no-cache'
          }
        });
      } catch (error) {
        return new Response(error instanceof Error ? error.message : 'Internal server error', {
          status: 500
        });
      }
    }

    // Handle API requests (for admin dashboard)
    if (path.startsWith('/api/')) {
      return handleApiRequest(request, url, env);
    }

    // Handle GitHub OAuth callback
    if (path === '/api/auth/github/callback') {
      return handleGitHubCallback(request, env);
    }

    // Handle 404 for unknown routes
    return new Response("Not found", { status: 404 });
  }
};

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // This would handle API requests from the admin dashboard
  // For security, these should be authenticated
  
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    return new Response('API key required', { status: 401 });
  }
  // In a real implementation, validate the API key against a stored value
  
  // Example API endpoints
  if (url.pathname === '/api/releases') {
    const releases = await env.DB.prepare('SELECT * FROM releases ORDER BY id DESC').all();
    return new Response(JSON.stringify(releases.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.pathname === '/api/stats') {
    // Get total update requests
    const requestsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM updateRequests').first();
    
    // Get latest request
    const latestRequest = await env.DB.prepare(`
      SELECT * FROM updateRequests 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).first();

    return new Response(JSON.stringify({
      requestsCount: requestsCount?.count || 0,
      latestRequest
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('API endpoint not found', { status: 404 });
}