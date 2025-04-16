import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Define types for Cloudflare Worker environment
interface D1Database {
  prepare: jest.Mock<any, any>;
  bind: jest.Mock<any, any>;
  all: jest.Mock<any, any>;
  run: jest.Mock<any, any>;
}

interface KVNamespace {
  get: jest.Mock<any, any>;
  put: jest.Mock<any, any>;
}

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface ExecutionContext {
  waitUntil: jest.Mock<any, any>;
}

// Mock the D1Database and KVNamespace
const mockD1Database: D1Database = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  all: jest.fn<any, any>().mockResolvedValue({ results: [] }),
  run: jest.fn<any, any>().mockResolvedValue(undefined)
};

const mockKVNamespace: KVNamespace = {
  get: jest.fn<any, any>(),
  put: jest.fn<any, any>()
};

// Mock environment
const mockEnv: Env = {
  DB: mockD1Database,
  CACHE: mockKVNamespace
};

// Mock execution context
const mockCtx: ExecutionContext = {
  waitUntil: jest.fn<any, any>()
};

// Mock the worker module
jest.mock('../../../worker/src/index', () => ({
  default: {
    fetch: jest.fn().mockImplementation(async (request: Request, env: Env) => {
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
    })
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
      expect(mockD1Database.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO updateRequests'));
    });

    it('should handle errors gracefully', async () => {
      // Mock a database error
      mockD1Database.prepare.mockImplementationOnce(() => {
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
      // Mock database response for releases
      (mockD1Database.all as jest.Mock<any, any>).mockResolvedValueOnce({
        results: [
          { id: 1, version: '1.2.3', platform: 'win', channel: 'stable' }
        ]
      });

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