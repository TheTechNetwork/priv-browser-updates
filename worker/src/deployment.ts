export async function handleDeployment(request: Request, env: any): Promise<Response> {
  return new Response(JSON.stringify({ status: 'stub', artifactUrl: '' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} 