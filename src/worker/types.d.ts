/// <reference types="@cloudflare/workers-types" />

declare global {
  const console: Console;
}

export interface Env {
  GITHUB_TOKEN?: string;
  KV_STORE?: any;
  DEPLOY_SECRET?: string;
} 