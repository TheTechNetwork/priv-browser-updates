// This file tests the generateUpdateXml function in isolation
import { generateUpdateXml } from '../../lib/update-service';
import type { Schema } from '../../lib/db-types';

describe('Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const normalizeXml = (xml: string) => {
    return xml
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ') // Normalize remaining whitespace
      .trim();
  };

  it('should generate update XML for no update case', () => {
    const request = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable'
    };

    const xml = generateUpdateXml(null, request);
    const normalizedXml = normalizeXml(xml);
    expect(normalizedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(normalizedXml).toContain('<response protocol="3.0">');
    expect(normalizedXml).toContain('<app appid="chromium">');
    expect(normalizedXml).toContain('<updatecheck status="noupdate"/>');
  });

  it('should generate update XML when update is available', () => {
    const request = {
      version: '1.0.0',
      platform: 'win',
      channel: 'stable'
    };

    const release: Schema['releases'] = {
      version: '2.0.0',
      platform: 'win',
      channel: 'stable',
      downloadUrl: 'https://example.com/download',
      sha256: 'abc123',
      fileSize: 1000000,
      isActive: true,
      releaseNotes: 'Test release'
    };

    const xml = generateUpdateXml(release, request);
    const normalizedXml = normalizeXml(xml);
    expect(normalizedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(normalizedXml).toContain('<response protocol="3.0">');
    expect(normalizedXml).toContain('<app appid="chromium">');
    expect(normalizedXml).toContain('<updatecheck status="ok">');
    expect(normalizedXml).toContain('<urls><url codebase="https://example.com/download"/>');
    expect(normalizedXml).toContain('<manifest version="2.0.0">');
    expect(normalizedXml).toContain('<packages><package');
    expect(normalizedXml).toContain('hash_sha256="abc123"');
    expect(normalizedXml).toContain('size="1000000"');
  });
});