/// <reference types="@cloudflare/workers-types" />

import { processUpdateRequest } from "./update-service";
import { handleGitHubCallback } from './auth';
import { fetchGitHubReleases, syncReleasesToDatabase } from './github';

interface KVNamespaceGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

interface KVNamespaceListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface KVNamespaceListResult<T> {
  keys: { name: string; expiration?: number; metadata?: T }[];
  list_complete: boolean;
  cursor?: string;
}

interface KVNamespaceGetWithMetadataResult<T = unknown, M = unknown> {
  value: T | null;
  metadata: M | null;
}

interface CustomKVNamespace {
  get(key: string, options?: Partial<KVNamespaceGetOptions>): Promise<string | null>;
  put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>>;
  getWithMetadata<T = unknown>(key: string): Promise<KVNamespaceGetWithMetadataResult<string, T>>;
}

interface ChannelSettings {
  stableChannel: boolean;
  betaChannel: boolean;
  devChannel: boolean;
}

export interface Env {
  DB: D1Database;
  CACHE: CustomKVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
}

// Add CORS headers to the response
function corsify(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  // ctx is required by Cloudflare Workers runtime but not used in our code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return corsify(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response: Response;

      // Handle GitHub OAuth callback first
      if (path === '/api/auth/github/callback') {
        response = await handleGitHubCallback(request, env);
        return corsify(response);
      }

      // Handle update requests
      if (path === "/update") {
        const version = url.searchParams.get("version");
        const platform = url.searchParams.get("platform");
        const channel = url.searchParams.get("channel");

        if (!version || !platform || !channel) {
          response = new Response("Missing required parameters", { status: 400 });
          return corsify(response);
        }

        const updateRequest = {
          version,
          platform,
          channel,
          ip: request.headers.get("cf-connecting-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        };

        const xml = await processUpdateRequest(updateRequest, env.DB);
        response = new Response(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'no-cache'
          }
        });
        return corsify(response);
      }

      // Handle other API requests (for admin dashboard)
      if (path.startsWith('/api/')) {
        response = await handleApiRequest(request, url, env);
        return corsify(response);
      }

      // Handle 404 for unknown routes
      response = new Response("Not found", { status: 404 });
      return corsify(response);
    } catch (error) {
      const response = new Response(error instanceof Error ? error.message : 'Internal server error', {
        status: 500
      });
      return corsify(response);
    }
  }
};

async function handleApiRequest(request: Request, url: URL, env: Env): Promise<Response> {
  // Check for authentication
  const apiKey = request.headers.get('X-API-Key');
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!apiKey && !token) {
    return new Response('Authentication required', { status: 401 });
  }
  
  // Handle releases endpoints
  if (url.pathname === '/api/releases') {
    const releases = await env.DB.prepare('SELECT * FROM releases ORDER BY id DESC').all();
    return new Response(JSON.stringify(releases.results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.pathname === '/api/releases/sync') {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const releases = await fetchGitHubReleases(env);
      await syncReleasesToDatabase(releases, env.DB);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to sync releases' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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

  if (url.pathname === '/api/settings') {
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(`
        SELECT key, value FROM configurations 
        WHERE key IN ('stableChannel', 'betaChannel', 'devChannel')
      `).all();
      
      const channelSettings: ChannelSettings = {
        stableChannel: true,
        betaChannel: true,
        devChannel: true
      };

      (results as Array<{ key: keyof ChannelSettings; value: string }>).forEach(row => {
        channelSettings[row.key] = row.value === 'true';
      });

      return new Response(JSON.stringify(channelSettings), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'PUT') {
      const body = await request.json() as Partial<ChannelSettings>;
      
      // Update each channel setting
      const validKeys: Array<keyof ChannelSettings> = ['stableChannel', 'betaChannel', 'devChannel'];
      for (const key of validKeys) {
        if (typeof body[key] === 'boolean') {
          await env.DB.prepare(`
            UPDATE configurations 
            SET value = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE key = ?
          `).bind(body[key].toString(), key).run();
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response('API endpoint not found', { status: 404 });
}