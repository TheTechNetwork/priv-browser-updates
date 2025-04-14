import { parseVersionString, compareVersions } from '../../lib/github';

describe('parseVersionString', () => {
  it('should parse a simple version string correctly', () => {
    expect(parseVersionString('1.2.3')).toEqual([1, 2, 3]);
  });

  it('should handle version strings with fewer parts', () => {
    expect(parseVersionString('1.2')).toEqual([1, 2]);
  });

  it('should handle version strings with more parts', () => {
    expect(parseVersionString('1.2.3.4.5')).toEqual([1, 2, 3, 4, 5]);
  });

  it('should convert non-numeric parts to 0', () => {
    expect(parseVersionString('1.2.abc')).toEqual([1, 2, 0]);
  });

  it('should handle empty version string', () => {
    expect(parseVersionString('')).toEqual([0]);
  });
});

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('should return 1 when first version is greater', () => {
    expect(compareVersions('1.3.0', '1.2.9')).toBe(1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.2.3', '1.2.2')).toBe(1);
  });

  it('should return -1 when first version is less', () => {
    expect(compareVersions('1.2.0', '1.2.1')).toBe(-1);
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
    expect(compareVersions('1.2.2', '1.2.3')).toBe(-1);
  });

  it('should handle versions with different number of parts', () => {
    expect(compareVersions('1.2.3', '1.2')).toBe(1);
    expect(compareVersions('1.2', '1.2.1')).toBe(-1);
    expect(compareVersions('1.2.0', '1.2')).toBe(0);
  });

  it('should handle complex version comparisons', () => {
    expect(compareVersions('10.2.0', '2.10.0')).toBe(1);
    expect(compareVersions('0.9.9', '1.0.0')).toBe(-1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });
});