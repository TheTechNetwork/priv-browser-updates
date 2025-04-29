import { Env } from '.';

interface GitHubAuthResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserData {
  id: number;
  name?: string;
  login: string;
  email: string;
  avatar_url: string;
}

export async function handleGitHubCallback(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { code } = await request.json() as { code: string };

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const data = await tokenResponse.json() as GitHubAuthResponse;

    if (data.error || !data.access_token) {
      return new Response(JSON.stringify({ error: data.error_description || 'Failed to get access token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the access token
    return new Response(JSON.stringify({ access_token: data.access_token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 