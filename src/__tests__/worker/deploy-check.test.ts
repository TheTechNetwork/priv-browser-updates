import { describe, expect, it, jest } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Cloudflare Worker Deployment', () => {
  it('should have a valid wrangler.toml configuration', () => {
    const wranglerPath = path.join(process.cwd(), 'worker', 'wrangler.toml');
    expect(fs.existsSync(wranglerPath)).toBe(true);
    
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    expect(wranglerContent).toContain('name = "chromium-update-server"');
    expect(wranglerContent).toContain('main = "src/index.ts"');
    expect(wranglerContent).toContain('binding = "DB"');
    expect(wranglerContent).toContain('binding = "CACHE"');
  });

  it('should pass wrangler deployment dry run', () => {
    const workerDir = path.join(process.cwd(), 'worker');
    
    // Execute wrangler deploy --dry-run and capture output
    let output: string;
    try {
      output = execSync('npx wrangler deploy --dry-run', { 
        cwd: workerDir,
        encoding: 'utf8'
      });
    } catch (error) {
      console.error('Wrangler deploy dry run failed:', error);
      throw error;
    }
    
    // Verify the output contains expected success messages
    expect(output).toContain('Total Upload:');
    expect(output).toContain('Your worker has access to the following bindings:');
    expect(output).toContain('--dry-run: exiting now.');
  });
});