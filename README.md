# Chromium Update Server

A self-hosted update server for Chromium-based browsers, deployed on Cloudflare.

## Overview

This project provides a complete solution for serving updates to your Chromium-based browser fork. It consists of:

1. **Admin Dashboard**: A React-based web interface for managing releases, viewing update statistics, and configuring the update server.
2. **Update Server**: A Cloudflare Worker that handles update requests from clients and serves update manifests.
3. **Database**: Uses Cloudflare D1 for storing release information, configurations, and update request logs.

## Features

- Serve update manifests for Chromium clients using the Omaha protocol
- Fetch release information from GitHub repositories
- Support multiple update channels (stable, beta, dev)
- Monitor update requests and client statistics
- Configure GitHub integration settings
- Cache GitHub API responses for performance

## Deployment

### Prerequisites

1. A Cloudflare account
2. Cloudflare API token with appropriate permissions
3. A GitHub repository for your Chromium fork releases

### Setup

1. **Create Cloudflare Resources**:
   - Create a Cloudflare Pages project
   - Create a Cloudflare D1 database
   - Create a Cloudflare KV namespace for caching

2. **Configure GitHub Secrets**:
   Add the following secrets to your GitHub repository:
   ```
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_D1_ID=your_d1_database_id
   CLOUDFLARE_KV_ID=your_kv_namespace_id
   ```

3. **Initialize Database**:
   Run the SQL migration script to set up the database schema:
   ```
   wrangler d1 execute chromium_updates --file=fine/migrations/20250414011058_create_initial_schema.sql
   ```

4. **Deploy**:
   Push to the main branch to trigger the GitHub Actions workflow, or manually run the workflow from the Actions tab.

## Configuring Your Chromium Fork

To configure your Chromium fork to use this update server:

1. Locate the update URL configuration in your Chromium source code (typically in `chrome/common/chrome_constants.cc`)
2. Update it to point to your Cloudflare Worker:
   ```cpp
   // Change this line:
   const char kBrowserUpdateURL[] = "https://tools.google.com/service/update2";
   
   // To:
   const char kBrowserUpdateURL[] = "https://your-worker.your-subdomain.workers.dev/update";
   ```

## Local Development

1. **Frontend**:
   ```
   npm install
   npm run dev
   ```

2. **Worker**:
   ```
   cd worker
   npm install
   npm run dev
   ```

## To Do
   TODO: add portal authentication
   
## License

MIT

## GitHub OAuth Setup

### 1. Create GitHub OAuth Application
1. Go to GitHub Settings > Developer Settings > OAuth Apps > New OAuth App
2. Fill in the application details:
   - Application name: Your app name
   - Homepage URL: Your frontend URL (e.g., https://your-app.pages.dev)
   - Authorization callback URL: https://your-app.pages.dev/auth/callback
   > **Important**: The callback URL must be your frontend URL where the React app is hosted, NOT your worker URL. 
   > - For local development: http://localhost:5173/auth/callback
   > - For production: https://your-app.pages.dev/auth/callback (or your custom domain)
3. Click "Register application"
4. Copy the Client ID and generate a Client Secret

### 2. Configure Cloudflare Worker
1. Install Wrangler CLI if not already installed:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Add secrets to Cloudflare Secret Manager:
   ```bash
   # GitHub OAuth credentials
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   
   # Database and KV credentials (if not using binding)
   wrangler secret put CLOUDFLARE_ACCOUNT_ID
   wrangler secret put CLOUDFLARE_API_TOKEN
   wrangler secret put CLOUDFLARE_D1_ID
   wrangler secret put CLOUDFLARE_KV_ID
   ```
   
   Alternatively, you can add secrets via the Cloudflare Dashboard:
   1. Go to Workers & Pages > your-worker > Settings > Variables
   2. Click "Add variable" and select "Encrypt"
   3. Add each secret as an encrypted variable

4. Configure bindings in your `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "your-database-name"
   database_id = "your-database-id"

   [[kv_namespaces]]
   binding = "CACHE"
   id = "your-kv-namespace-id"
   ```

5. Deploy the worker:
   ```bash
   npm run deploy
   ```

### 3. Configure Frontend
1. Create a `.env` file in the project root:
   ```env
   # Only the GitHub Client ID is needed in the frontend
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   ```

### 4. Development Setup
For local development:

1. Create a `.env.local` file in the project root:
   ```env
   # Frontend Environment Variables
   VITE_GITHUB_CLIENT_ID=your_github_client_id
   ```

2. Create a `wrangler.dev.toml` for local worker development:
   ```toml
   name = "your-worker-dev"
   main = "src/index.ts"
   compatibility_date = "2024-03-20"

   # Use Cloudflare Secret Manager values in development
   [vars]
   ENVIRONMENT = "development"

   # Bindings will use your production secrets from Cloudflare
   [[d1_databases]]
   binding = "DB"
   database_name = "your-database-name"
   database_id = "your-database-id"

   [[kv_namespaces]]
   binding = "CACHE"
   id = "your-kv-namespace-id"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Run the worker locally (it will use your Cloudflare secrets):
   ```bash
   npm run worker:dev
   ```

5. Your local development URLs will be:
   - Frontend: http://localhost:5173
   - Worker: http://localhost:8787
   - GitHub OAuth Callback URL (for local dev): http://localhost:5173/auth/callback

### 5. Security Considerations
- Use Cloudflare Secret Manager for all sensitive values
- Never store secrets in plain text in configuration files
- Only the GitHub Client ID should be in frontend environment variables
- Use encrypted environment variables in Cloudflare Dashboard
- Use bindings in `wrangler.toml` for database and KV connections
- Implement rate limiting for the OAuth callback endpoint

### 6. Troubleshooting
- If authentication fails, check:
  1. GitHub OAuth callback URL matches your domain
  2. Environment variables are correctly set
  3. Worker is deployed and running
  4. Frontend is using the correct Client ID
