import { logUpdateRequest, getLatestVersion, processUpdateRequest } from '../../lib/update-service';
import type { Schema } from '../../lib/db-types';

// Mock the fine module
jest.mock('../../lib/fine', () => {
  const mockInsert = jest.fn().mockResolvedValue(undefined);
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  
  let mockReleases: Schema['releases'][] = [];
  
  return {
    fine: {
      table: (tableName: string) => {
        if (tableName === 'updateRequests') {
          return {
            insert: mockInsert
          };
        } else if (tableName === 'releases') {
          return {
            select: () => {
              return {
                eq: (field: string, value: any) => {
                  // Filter the mock releases based on the eq conditions
                  if (field === 'platform') {
                    mockReleases = mockReleases.filter(r => r.platform === value);
                  } else if (field === 'channel') {
                    mockReleases = mockReleases.filter(r => r.channel === value);
                  } else if (field === 'isActive') {
                    mockReleases = mockReleases.filter(r => r.isActive === value);
                  }
                  return {
                    eq: (field: string, value: any) => {
                      if (field === 'platform') {
                        mockReleases = mockReleases.filter(r => r.platform === value);
                      } else if (field === 'channel') {
                        mockReleases = mockReleases.filter(r => r.channel === value);
                      } else if (field === 'isActive') {
                        mockReleases = mockReleases.filter(r => r.isActive === value);
                      }
                      return {
                        eq: (field: string, value: any) => {
                          if (field === 'platform') {
                            mockReleases = mockReleases.filter(r => r.platform === value);
                          } else if (field === 'channel') {
                            mockReleases = mockReleases.filter(r => r.channel === value);
                          } else if (field === 'isActive') {
                            mockReleases = mockReleases.filter(r => r.isActive === value);
                          }
                          return Promise.resolve(mockReleases);
                        }
                      };
                    }
                  };
                }
              };
            }
          };
        }
        return {
          select: mockSelect,
          eq: mockEq,
          insert: mockInsert
        };
      },
      _setMockReleases: (releases: Schema['releases'][]) => {
        mockReleases = [...releases];
      },
      _getMockInsert: () => mockInsert
    }
  };
});

// Mock the compareVersions function
jest.mock('../../lib/github', () => ({
  compareVersions: (v1: string, v2: string) => {
    const [major1, minor1, patch1 = 0] = v1.split('.').map(Number);
    const [major2, minor2, patch2 = 0] = v2.split('.').map(Number);
    
    if (major1 !== major2) return major1 > major2 ? 1 : -1;
    if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
    if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
    return 0;
  }
}));

// Get access to the mocked fine module
const mockedFine = jest.requireMock('../../lib/fine').fine;

describe('logUpdateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log update request to the database', async () => {
    const mockRequest = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      userAgent: 'Test User Agent',
      ip: '127.0.0.1'
    };

    await logUpdateRequest(mockRequest);

    // Check that insert was called with the correct data
    const mockInsert = mockedFine._getMockInsert();
    expect(mockInsert).toHaveBeenCalledWith({
      clientVersion: mockRequest.version,
      platform: mockRequest.platform,
      channel: mockRequest.channel,
      userAgent: mockRequest.userAgent,
      ip: mockRequest.ip
    });
  });
});

describe('getLatestVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no releases are found', async () => {
    // Set up mock to return empty array
    mockedFine._setMockReleases([]);

    const result = await getLatestVersion('win', 'stable');
    expect(result).toBeNull();
  });

  it('should return the release with the highest version number', async () => {
    // Set up mock releases
    const mockReleases: Schema['releases'][] = [
      {
        id: 1,
        version: '1.0.0',
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-1.0.0.exe',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        version: '1.2.0',
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-1.2.0.exe',
        isActive: true,
        createdAt: '2023-01-02T00:00:00Z'
      },
      {
        id: 3,
        version: '1.1.0',
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-1.1.0.exe',
        isActive: true,
        createdAt: '2023-01-03T00:00:00Z'
      }
    ];

    mockedFine._setMockReleases(mockReleases);

    const result = await getLatestVersion('win', 'stable');
    expect(result).not.toBeNull();
    expect(result?.version).toBe('1.2.0');
    expect(result?.id).toBe(2);
  });

  it('should only consider releases for the specified platform and channel', async () => {
    // Set up mock releases with different platforms and channels
    const mockReleases: Schema['releases'][] = [
      {
        id: 1,
        version: '1.0.0',
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-1.0.0.exe',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        version: '2.0.0', // Higher version but different platform
        channel: 'stable',
        platform: 'mac',
        downloadUrl: 'https://example.com/download/chromium-2.0.0.dmg',
        isActive: true,
        createdAt: '2023-01-02T00:00:00Z'
      },
      {
        id: 3,
        version: '3.0.0', // Higher version but different channel
        channel: 'beta',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-3.0.0.exe',
        isActive: true,
        createdAt: '2023-01-03T00:00:00Z'
      }
    ];

    mockedFine._setMockReleases(mockReleases);

    const result = await getLatestVersion('win', 'stable');
    expect(result).not.toBeNull();
    expect(result?.version).toBe('1.0.0');
    expect(result?.id).toBe(1);
  });

  it('should only consider active releases', async () => {
    // Set up mock releases with some inactive
    const mockReleases: Schema['releases'][] = [
      {
        id: 1,
        version: '1.0.0',
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-1.0.0.exe',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        version: '2.0.0', // Higher version but inactive
        channel: 'stable',
        platform: 'win',
        downloadUrl: 'https://example.com/download/chromium-2.0.0.exe',
        isActive: false,
        createdAt: '2023-01-02T00:00:00Z'
      }
    ];

    mockedFine._setMockReleases(mockReleases);

    const result = await getLatestVersion('win', 'stable');
    expect(result).not.toBeNull();
    expect(result?.version).toBe('1.0.0');
    expect(result?.id).toBe(1);
  });
});

describe('processUpdateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log the request and return update XML when an update is available', async () => {
    const mockRequest = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      userAgent: 'Test User Agent',
      ip: '127.0.0.1'
    };

    // Set up mock to return a newer release
    const mockRelease: Schema['releases'] = {
      id: 1,
      version: '1.2.0',
      channel: 'stable',
      platform: 'win',
      downloadUrl: 'https://example.com/download/chromium-1.2.0.exe',
      fileSize: 50000000,
      sha256: 'abc123def456',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z'
    };

    mockedFine._setMockReleases([mockRelease]);

    const result = await processUpdateRequest(mockRequest);

    // Check that the request was logged
    const mockInsert = mockedFine._getMockInsert();
    expect(mockInsert).toHaveBeenCalled();

    // Check that the XML contains update information
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<updatecheck status="ok">');
    expect(result).toContain(`<url codebase="${mockRelease.downloadUrl}"/>`);
    expect(result).toContain(`<manifest version="${mockRelease.version}">`);
  });

  it('should log the request and return "noupdate" XML when no update is available', async () => {
    const mockRequest = {
      version: '2.0.0', // Higher than available version
      platform: 'win',
      channel: 'stable',
      userAgent: 'Test User Agent',
      ip: '127.0.0.1'
    };

    // Set up mock to return an older release
    const mockRelease: Schema['releases'] = {
      id: 1,
      version: '1.0.0',
      channel: 'stable',
      platform: 'win',
      downloadUrl: 'https://example.com/download/chromium-1.0.0.exe',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z'
    };

    mockedFine._setMockReleases([mockRelease]);

    const result = await processUpdateRequest(mockRequest);

    // Check that the request was logged
    const mockInsert = mockedFine._getMockInsert();
    expect(mockInsert).toHaveBeenCalled();

    // Check that the XML contains "noupdate" status
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<updatecheck status="noupdate"/>');
  });

  it('should log the request and return "noupdate" XML when no releases are found', async () => {
    const mockRequest = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable',
      userAgent: 'Test User Agent',
      ip: '127.0.0.1'
    };

    // Set up mock to return no releases
    mockedFine._setMockReleases([]);

    const result = await processUpdateRequest(mockRequest);

    // Check that the request was logged
    const mockInsert = mockedFine._getMockInsert();
    expect(mockInsert).toHaveBeenCalled();

    // Check that the XML contains "noupdate" status
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<updatecheck status="noupdate"/>');
  });
});