// This file tests the generateUpdateXml function in isolation
// We'll mock the compareVersions function directly

// Import the function to test
import { generateUpdateXml } from '../../lib/update-service';

// Mock the compareVersions function
jest.mock('../../lib/github', () => ({
  compareVersions: (v1, v2) => {
    const [major1, minor1, patch1 = 0] = v1.split('.').map(Number);
    const [major2, minor2, patch2 = 0] = v2.split('.').map(Number);
    
    if (major1 !== major2) return major1 > major2 ? 1 : -1;
    if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
    if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
    return 0;
  }
}));

// Mock the fine module
jest.mock('../../lib/fine', () => ({
  fine: {
    table: () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('generateUpdateXml', () => {
  const mockRelease = {
    id: 1,
    version: '1.2.3',
    channel: 'stable',
    platform: 'win',
    downloadUrl: 'https://example.com/download/chromium-1.2.3.exe',
    releaseNotes: 'Test release notes',
    fileSize: 50000000,
    sha256: 'abc123def456',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const mockRequest = {
    version: '1.0.0',
    platform: 'win',
    channel: 'stable',
    userAgent: 'Test User Agent',
    ip: '127.0.0.1'
  };

  it('should generate update XML when an update is available', () => {
    const xml = generateUpdateXml(mockRelease, mockRequest);
    
    // Check that the XML contains the expected elements
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<response protocol="3.0">');
    expect(xml).toContain('<app appid="chromium">');
    expect(xml).toContain('<updatecheck status="ok">');
    expect(xml).toContain(`<url codebase="${mockRelease.downloadUrl}"/>`);
    expect(xml).toContain(`<manifest version="${mockRelease.version}">`);
    expect(xml).toContain(`<package name="chromium-${mockRelease.version}" hash_sha256="${mockRelease.sha256}" size="${mockRelease.fileSize}" required="true"/>`);
  });

  it('should generate "noupdate" XML when no update is available', () => {
    const xml = generateUpdateXml(null, mockRequest);
    
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<response protocol="3.0">');
    expect(xml).toContain('<app appid="chromium">');
    expect(xml).toContain('<updatecheck status="noupdate"/>');
  });

  it('should generate "noupdate" XML when client is already on latest version', () => {
    const upToDateRequest = {
      ...mockRequest,
      version: '1.2.3' // Same as mockRelease.version
    };
    
    const xml = generateUpdateXml(mockRelease, upToDateRequest);
    
    expect(xml).toContain('<updatecheck status="noupdate"/>');
  });

  it('should generate "noupdate" XML when client has newer version', () => {
    const newerRequest = {
      ...mockRequest,
      version: '1.3.0' // Newer than mockRelease.version
    };
    
    const xml = generateUpdateXml(mockRelease, newerRequest);
    
    expect(xml).toContain('<updatecheck status="noupdate"/>');
  });

  it('should handle missing sha256 and fileSize', () => {
    const releaseWithoutDetails = {
      ...mockRelease,
      sha256: undefined,
      fileSize: undefined
    };
    
    const xml = generateUpdateXml(releaseWithoutDetails, mockRequest);
    
    expect(xml).toContain(`<package name="chromium-${mockRelease.version}" hash_sha256="" size="0" required="true"/>`);
  });
});