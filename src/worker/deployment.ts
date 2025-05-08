export async function handleDeployment(_request: Request, _env: any): Promise<Response> {
  return new Response(JSON.stringify({ status: 'stub', artifactUrl: '' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} 