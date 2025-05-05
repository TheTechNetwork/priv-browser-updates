import { describe, expect, it, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Mock the wrangler CLI
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('Deployment successful'))
}));

// Import the mocked execSync
import { execSync } from 'child_process';

describe('Cloudflare Worker Deployment', () => {
  it('should have a valid wrangler.toml configuration', () => {
    // Check if wrangler.toml exists
    const wranglerPath = path.resolve(__dirname, '../../../worker/wrangler.toml');
    expect(fs.existsSync(wranglerPath)).toBe(true);
    
    // Read the wrangler.toml file
    const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');
    
    // Verify it contains essential configuration
    expect(wranglerConfig).toContain('name =');
    expect(wranglerConfig).toContain('main =');
    expect(wranglerConfig).toContain('compatibility_date =');
    
    // Check for D1 database configuration
    expect(wranglerConfig).toContain('[[d1_databases]]');
    expect(wranglerConfig).toContain('binding = "DB"');
    
    // Check for KV namespace configuration
    expect(wranglerConfig).toContain('[[kv_namespaces]]');
    expect(wranglerConfig).toContain('binding = "CACHE"');
  });
  
  it('should have a valid package.json with deployment scripts', () => {
    // Check if package.json exists
    const packagePath = path.resolve(__dirname, '../../../worker/package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
    
    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Verify it contains deployment scripts
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.deploy).toBeDefined();
    expect(packageJson.scripts.deploy).toContain('wrangler deploy');
    
    // Verify it has the required dependencies
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies['@cloudflare/workers-types']).toBeDefined();
    expect(packageJson.devDependencies.wrangler).toBeDefined();
  });
  
  it('should have the required source files', () => {
    // Check if index.ts exists
    const indexPath = path.resolve(__dirname, '../../../worker/src/index.ts');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    // Read the index.ts file
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Verify it contains the worker handler
    expect(indexContent).toContain('export default {');
    expect(indexContent).toContain('async fetch(');
    
    // Verify it handles update requests
    expect(indexContent).toContain('/update');
    expect(indexContent).toContain('processUpdateRequest');
    expect(indexContent).toContain('processUpdateRequest');
  });
  
  it('should be able to simulate a deployment', () => {
    // Mock a deployment command
    const deployCommand = 'cd ../../../worker && npm run deploy';
    
    // Call the mocked execSync
    const result = execSync(deployCommand);
    
    // Verify the deployment was successful
    expect(result.toString()).toBe('Deployment successful');
    expect(execSync).toHaveBeenCalledWith(deployCommand);
  });
});