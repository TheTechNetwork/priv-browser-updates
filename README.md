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

## License

MIT