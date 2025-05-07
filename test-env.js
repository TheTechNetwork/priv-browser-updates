process.env.VITE_GITHUB_CLIENT_ID = 'test-client-id';
process.env.VITE_GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.VITE_API_URL = 'http://localhost:8787';

// Mock import.meta
global.import = {};
global.import.meta = {
  env: {
    DEV: true,
    VITE_GITHUB_CLIENT_ID: process.env.VITE_GITHUB_CLIENT_ID,
    VITE_GITHUB_CLIENT_SECRET: process.env.VITE_GITHUB_CLIENT_SECRET,
    VITE_API_URL: process.env.VITE_API_URL,
  }
};