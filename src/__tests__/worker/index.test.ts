import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Env } from '../../../worker/src/index';
import { createMockD1Database, createMockKVNamespace, createMockExecutionContext } from './mocks';

// Mock environment
const mockEnv: Env = {
  DB: createMockD1Database(),
  CACHE: createMockKVNamespace(),
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
  GITHUB_OWNER: 'test-owner',
  GITHUB_REPO: 'test-repo',
  GITHUB_TOKEN: 'test-token'
};

// Mock execution context
const mockCtx = createMockExecutionContext();

// Mock the worker module
jest.mock('../../../worker/src/index', () => ({
  default: {
    fetch: (jest.fn().mockImplementation(async (request: any, _env?: any, _ctx?: any) => {
      const url = new URL(request.url);
      
      if (url.pathname === '/update') {
        // Mock update response
        return new Response('<?xml version="1.0" encoding="UTF-8"?><response protocol="3.0"><app appid="chromium"><updatecheck status="noupdate"/></app></response>', {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'no-cache'
          }
        });
      } else if (url.pathname === '/api/releases') {
        // Mock releases API response
        return new Response(JSON.stringify({ results: [{ id: 1, version: '1.2.3', platform: 'win', channel: 'stable' }] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (url.pathname === '/api/sync') {
        // Mock sync API response
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 404 for unknown paths
        return new Response('Not found', { status: 404 });
      }
    })) as any
  }
}));

// Import the mocked worker
import workerHandler from '../../../worker/src/index';

describe('Cloudflare Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Update endpoint', () => {
    it('should handle update requests correctly', async () => {
      // Create a mock request
      const request = new Request('https://example.com/update?version=1.0.0&platform=win&channel=stable', {
        method: 'GET',
        headers: {
          'User-Agent': 'Test User Agent',
          'CF-Connecting-IP': '127.0.0.1'
        }
      });

      // Call the worker handler
      const response = await workerHandler.fetch(request, mockEnv, mockCtx);

      // Verify the response
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/xml');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');

      // Verify that the database was called to log the request
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO updateRequests'));
    });

    it('should handle errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(mockEnv.DB, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      // Create a mock request
      const request = new Request('https://example.com/update?version=1.0.0&platform=win&channel=stable');

      // Call the worker handler
      const response = await workerHandler.fetch(request, mockEnv, mockCtx);

      // Verify the response indicates an error
      expect(response.status).toBe(500);
    });
  });

  describe('API endpoints', () => {
    it('should handle /api/releases endpoint correctly', async () => {
      // Create a mock request
      const request = new Request('https://example.com/api/releases', {
        method: 'GET',
        headers: {
          'X-API-Key': 'test-api-key'
        }
      });

      // Call the worker handler
      const response = await workerHandler.fetch(request, mockEnv, mockCtx);

      // Verify the response
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      // Verify the response body
      const responseBody = await response.json();
      expect(responseBody).toEqual({ results: [{ id: 1, version: '1.2.3', platform: 'win', channel: 'stable' }] });
    });

    it('should handle /api/sync endpoint correctly', async () => {
      // Create a mock request
      const request = new Request('https://example.com/api/sync', {
        method: 'POST',
        headers: {
          'X-API-Key': 'test-api-key'
        }
      });

      // Call the worker handler
      const response = await workerHandler.fetch(request, mockEnv, mockCtx);

      // Verify the response
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      // Verify the response body
      const responseBody = await response.json();
      expect(responseBody).toEqual({ success: true });
    });

    it('should return 404 for unknown API endpoints', async () => {
      // Create a mock request
      const request = new Request('https://example.com/api/unknown');

      // Call the worker handler
      const response = await workerHandler.fetch(request, mockEnv, mockCtx);

      // Verify the response
      expect(response.status).toBe(404);
    });
  });

  it('should return 404 for unknown paths', async () => {
    // Create a mock request
    const request = new Request('https://example.com/unknown');

    // Call the worker handler
    const response = await workerHandler.fetch(request, mockEnv, mockCtx);

    // Verify the response
    expect(response.status).toBe(404);
  });
});