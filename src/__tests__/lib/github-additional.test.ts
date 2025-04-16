/**
 * Additional tests for GitHub-related functionality
 * 
 * Note: The core version comparison functions (parseVersionString and compareVersions)
 * are already well-tested in github.test.ts and github.mock.test.ts.
 * 
 * The functions that interact with external services (getConfig, fetchGitHubReleases, 
 * syncReleasesToDatabase) would require more complex integration testing or 
 * sophisticated mocking to test properly. Those tests are out of scope for this
 * basic unit testing coverage.
 */

// Use the standalone implementation from version-utils.js instead of importing from github.ts
// This avoids issues with importing from the actual module
const { parseVersionString, compareVersions } = require('./version-utils');

// Additional edge case tests for parseVersionString
describe('parseVersionString (additional tests)', () => {
  it('should handle version strings with leading zeros', () => {
    expect(parseVersionString('1.01.001')).toEqual([1, 1, 1]);
  });

  it('should handle version strings with non-numeric characters between numbers', () => {
    expect(parseVersionString('1.2-beta.3')).toEqual([1, 2, 3]);
  });

  it('should handle version strings with very large numbers', () => {
    expect(parseVersionString('999999.888888.777777')).toEqual([999999, 888888, 777777]);
  });
});

// Additional edge case tests for compareVersions
describe('compareVersions (additional tests)', () => {
  it('should handle comparing versions with different formats', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0.0', '1.0')).toBe(0);
  });

  it('should handle comparing versions with leading zeros', () => {
    expect(compareVersions('1.01.0', '1.1.0')).toBe(0);
    expect(compareVersions('01.1.0', '1.1.0')).toBe(0);
  });

  it('should handle comparing versions with different number of components', () => {
    expect(compareVersions('1.2', '1.2.0.0.0')).toBe(0);
    expect(compareVersions('1.2.0.0.0', '1.2')).toBe(0);
    expect(compareVersions('1.2.3', '1.2')).toBe(1);
    expect(compareVersions('1.2', '1.2.3')).toBe(-1);
  });

  it('should handle comparing with empty version strings', () => {
    expect(compareVersions('', '0')).toBe(0);
    expect(compareVersions('0', '')).toBe(0);
    expect(compareVersions('', '')).toBe(0);
    expect(compareVersions('1.0', '')).toBe(1);
    expect(compareVersions('', '1.0')).toBe(-1);
  });
});