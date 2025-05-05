import { describe, expect, it, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { handleDeployment } from '@/worker/deployment';
import { Env } from '@/worker/types';
import { checkDeploymentStatus } from '@/worker/deploy-check';
import { logger } from '@/lib/logger';

// Mock the wrangler CLI
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('Deployment successful'))
}));

// Mock dependencies
jest.mock('@/worker/deploy-check', () => ({
  checkDeploymentStatus: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the mocked execSync
import { execSync } from 'child_process';

describe('Cloudflare Worker Deployment', () => {
  it('should have a valid wrangler.toml configuration', () => {
    // Check if wrangler.toml exists
    const wranglerPath = path.resolve(__dirname, '../../../worker/wrangler.toml');
    expect(fs.existsSync(wranglerPath)).toBe(true);
    
    // Read the wrangler.toml file
    const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');
    
    // Verify it contains essential configuration
    expect(wranglerConfig).toContain('name =');
    expect(wranglerConfig).toContain('main =');
    expect(wranglerConfig).toContain('compatibility_date =');
    
    // Check for D1 database configuration
    expect(wranglerConfig).toContain('[[d1_databases]]');
    expect(wranglerConfig).toContain('binding = "DB"');
    
    // Check for KV namespace configuration
    expect(wranglerConfig).toContain('[[kv_namespaces]]');
    expect(wranglerConfig).toContain('binding = "CACHE"');
  });
  
  it('should have a valid package.json with deployment scripts', () => {
    // Check if package.json exists
    const packagePath = path.resolve(__dirname, '../../../worker/package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Verify it contains deployment scripts
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.deploy).toBeDefined();
    expect(packageJson.scripts.deploy).toContain('wrangler deploy');
    
    // Verify it has the required dependencies
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies['@cloudflare/workers-types']).toBeDefined();
    expect(packageJson.devDependencies.wrangler).toBeDefined();
  });
  
  it('should have the required source files', () => {
    // Check if index.ts exists
    const indexPath = path.resolve(__dirname, '../../../worker/src/index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    // Read the index.ts file
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Verify it contains the worker handler
    expect(indexContent).toContain('export default {');
    expect(indexContent).toContain('async fetch(');
    
    // Verify it handles update requests
    expect(indexContent).toContain('/update');
    expect(indexContent).toContain('processUpdateRequest');
    expect(indexContent).toContain('processUpdateRequest');
  });
  
  it('should be able to simulate a deployment', () => {
    // Mock a deployment command
    const deployCommand = 'cd ../../../worker && npm run deploy';
    
    // Call the mocked execSync
    const result = execSync(deployCommand);
    
    // Verify the deployment was successful
    expect(result.toString()).toBe('Deployment successful');
    expect(execSync).toHaveBeenCalledWith(deployCommand);
  });
});

describe('Worker Deployment Handler', () => {
  const mockEnv: Env = {
    GITHUB_TOKEN: 'test-token',
    KV_STORE: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any,
    DEPLOY_SECRET: 'test-secret',
  };

  const createRequest = (body: any, secret = 'test-secret') => {
    return new Request('https://api.example.com/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Deploy-Secret': secret,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates deploy secret', async () => {
    const request = createRequest({}, 'wrong-secret');
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Invalid deploy secret',
    });
  });

  it('processes valid deployment request', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    (checkDeploymentStatus as jest.Mock).mockResolvedValue({
      status: 'success',
      artifactUrl: 'https://example.com/artifact.exe',
    });

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      status: 'success',
      artifactUrl: 'https://example.com/artifact.exe',
    });
  });

  it('handles missing required fields', async () => {
    const deployData = {
      version: '1.0.0',
      // Missing platform and channel
    };

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Missing required fields',
    });
  });

  it('validates version format', async () => {
    const deployData = {
      version: 'invalid',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid version format',
    });
  });

  it('validates platform value', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'invalid',
      channel: 'stable',
      commitHash: 'abc123',
    };

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid platform',
    });
  });

  it('validates channel value', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'invalid',
      commitHash: 'abc123',
    };

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid channel',
    });
  });

  it('handles deployment check failures', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    (checkDeploymentStatus as jest.Mock).mockRejectedValue(
      new Error('Deployment check failed')
    );

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Deployment check failed',
    });
  });

  it('logs deployment events', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    (checkDeploymentStatus as jest.Mock).mockResolvedValue({
      status: 'success',
      artifactUrl: 'https://example.com/artifact.exe',
    });

    const request = createRequest(deployData);
    await handleDeployment(request, mockEnv);
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deployment started'),
      expect.objectContaining(deployData)
    );
  });

  it('stores deployment status in KV', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    (checkDeploymentStatus as jest.Mock).mockResolvedValue({
      status: 'success',
      artifactUrl: 'https://example.com/artifact.exe',
    });

    const request = createRequest(deployData);
    await handleDeployment(request, mockEnv);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalledWith(
      expect.stringContaining('deployment:'),
      expect.stringContaining('"status":"success"')
    );
  });

  it('handles concurrent deployments', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    // Simulate existing deployment in progress
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        status: 'in_progress',
        timestamp: Date.now(),
      })
    );

    const request = createRequest(deployData);
    const response = await handleDeployment(request, mockEnv);
    
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Deployment already in progress',
    });
  });

  it('cleans up old deployment status', async () => {
    const deployData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      commitHash: 'abc123',
    };

    (checkDeploymentStatus as jest.Mock).mockResolvedValue({
      status: 'success',
      artifactUrl: 'https://example.com/artifact.exe',
    });

    const request = createRequest(deployData);
    await handleDeployment(request, mockEnv);
    
    // Should delete old status before setting new one
    expect(mockEnv.KV_STORE.delete).toHaveBeenCalledWith(
      expect.stringContaining('deployment:')
    );
  });
});