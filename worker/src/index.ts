import { processUpdateRequest } from './update-service';

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
    
    // Process the update request
    const updateXml = await processUpdateRequest({
      version,
      platform,
      channel,
      ip,
      userAgent
    }, env.DB);
    
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