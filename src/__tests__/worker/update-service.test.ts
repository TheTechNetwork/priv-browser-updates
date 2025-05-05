import { handleUpdateCheck } from '@/worker/update-service';
import { Env } from '@/worker/types';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Update Check Service', () => {
  const mockEnv: Env = {
    GITHUB_TOKEN: 'test-token',
    KV_STORE: {
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any,
    DEPLOY_SECRET: 'test-secret',
  };

  const createRequest = (body: any) => {
    return new Request('https://api.example.com/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes valid update check request', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    // Mock KV store to return update data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
      changelogUrl: 'https://example.com/changelog',
    }));

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasUpdate: true,
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
      changelogUrl: 'https://example.com/changelog',
    });
  });

  it('handles request with no available update', async () => {
    const updateData = {
      currentVersion: '1.1.0',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    // Mock KV store to return same version
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
    }));

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({
      hasUpdate: false,
    });
  });

  it('validates required fields', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      // Missing platform and channel
    };

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Missing required fields',
    });
  });

  it('validates version format', async () => {
    const updateData = {
      currentVersion: 'invalid',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid version format',
    });
  });

  it('validates platform value', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'invalid',
      channel: 'stable',
      arch: 'x64',
    };

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid platform',
    });
  });

  it('validates channel value', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'invalid',
      arch: 'x64',
    };

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid channel',
    });
  });

  it('handles multiple platform architectures', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'stable',
      arch: 'arm64',
    };

    // Mock KV store to return platform-specific update
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0',
      platforms: {
        'win-x64': {
          downloadUrl: 'https://example.com/update-x64.exe',
          sha256: 'abc123',
        },
        'win-arm64': {
          downloadUrl: 'https://example.com/update-arm64.exe',
          sha256: 'def456',
        },
      },
      releaseDate: '2025-01-01',
    }));

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.downloadUrl).toBe('https://example.com/update-arm64.exe');
    expect(responseData.sha256).toBe('def456');
  });

  it('handles update cache', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    // First request - no cache
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValueOnce(null);

    const request1 = createRequest(updateData);
    await handleUpdateCheck(request1, mockEnv);

    // Should attempt to cache the response
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();

    // Second request - with cache
    const cachedData = {
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
    };
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));

    const request2 = createRequest(updateData);
    const response2 = await handleUpdateCheck(request2, mockEnv);
    
    const responseData = await response2.json();
    expect(responseData).toEqual({
      hasUpdate: true,
      ...cachedData,
    });
  });

  it('logs update check requests', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    const request = createRequest(updateData);
    await handleUpdateCheck(request, mockEnv);
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Update check'),
      expect.objectContaining(updateData)
    );
  });

  it('handles corrupted cache data', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'stable',
      arch: 'x64',
    };

    // Mock corrupted cache data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue('invalid-json');

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Internal server error',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('respects update channel hierarchy', async () => {
    const updateData = {
      currentVersion: '1.0.0',
      platform: 'win',
      channel: 'beta',
      arch: 'x64',
    };

    // Mock KV store to return channel-specific data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0-beta.1',
      downloadUrl: 'https://example.com/beta-update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
      channel: 'beta',
    }));

    const request = createRequest(updateData);
    const response = await handleUpdateCheck(request, mockEnv);
    
    const responseData = await response.json();
    expect(responseData.version).toBe('1.1.0-beta.1');
    expect(responseData.downloadUrl).toContain('beta-update');
  });
});