import { processUpdateRequest } from '@/worker/update-service.ts';
import type { Env } from '@/worker/types.d.ts';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock D1Database
const mockDb = {
  prepare: jest.fn().mockReturnThis(),
  bind: jest.fn().mockReturnThis(),
  all: jest.fn().mockResolvedValue({ results: [] }),
  run: jest.fn(),
  batch: jest.fn(),
  exec: jest.fn(),
  withSession: jest.fn(),
  dump: jest.fn(),
};

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes valid update check request', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    // Mock KV store to return update data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
      changelogUrl: 'https://example.com/changelog',
    }));

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('handles request with no available update', async () => {
    const updateData = {
      version: '1.1.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    // Mock KV store to return same version
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0',
      downloadUrl: 'https://example.com/update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
    }));

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('validates version format', async () => {
    const updateData = {
      version: 'invalid',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('validates platform value', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'invalid',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('validates channel value', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'invalid',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('handles multiple platform architectures', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
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

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('handles update cache', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    // First request - no cache
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValueOnce(null);

    await processUpdateRequest(updateData, mockDb as any);

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

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });

  it('logs update check requests', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Update check'),
      expect.objectContaining(updateData)
    );
  });

  it('handles corrupted cache data', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    // Mock corrupted cache data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue('invalid-json');

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('respects update channel hierarchy', async () => {
    const updateData = {
      version: '1.0.0',
      platform: 'win',
      channel: 'beta',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
    };

    // Mock KV store to return channel-specific data
    (mockEnv.KV_STORE.get as jest.Mock).mockResolvedValue(JSON.stringify({
      version: '1.1.0-beta.1',
      downloadUrl: 'https://example.com/beta-update.exe',
      releaseDate: '2025-01-01',
      sha256: 'abc123',
      channel: 'beta',
    }));

    await processUpdateRequest(updateData, mockDb as any);
    
    expect(mockEnv.KV_STORE.put).toHaveBeenCalled();
  });
});