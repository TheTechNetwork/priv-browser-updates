import { Env } from '.';

interface GitHubAuthResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export async function handleGitHubCallback(request: Request, env: Env): Promise<Response> {
  try {
    let code: string | null = null;

    if (request.method === 'GET') {
      // Handle the initial GitHub redirect
      const url = new URL(request.url);
      code = url.searchParams.get('code');
      if (!code) {
        const error = url.searchParams.get('error_description') || 'No code provided';
        return Response.redirect('http://localhost:5173/login?error=' + encodeURIComponent(error));
      }
    } else if (request.method === 'POST') {
      // Handle the frontend's token exchange request
      const body = await request.json() as { code: string };
      code = body.code;
    } else {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log GitHub credentials (redacted)
    console.log('GitHub Client ID:', env.GITHUB_CLIENT_ID ? 'Set' : 'Not set');
    console.log('GitHub Client Secret:', env.GITHUB_CLIENT_SECRET ? 'Set' : 'Not set');

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    console.log('Token response status:', tokenResponse.status);
    const data = await tokenResponse.json() as GitHubAuthResponse;
    console.log('Token response data:', { 
      error: data.error,
      error_description: data.error_description,
      has_token: !!data.access_token
    });

    if (data.error || !data.access_token) {
      const error = data.error_description || 'Failed to get access token';
      if (request.method === 'GET') {
        return Response.redirect('http://localhost:5173/login?error=' + encodeURIComponent(error));
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For GET requests, redirect back to the frontend with the token
    if (request.method === 'GET') {
      return Response.redirect('http://localhost:5173/auth/callback?token=' + data.access_token);
    }

    // For POST requests, return the token as JSON
    return new Response(JSON.stringify({ access_token: data.access_token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GitHub callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    if (request.method === 'GET') {
      return Response.redirect('http://localhost:5173/login?error=' + encodeURIComponent(errorMessage));
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 