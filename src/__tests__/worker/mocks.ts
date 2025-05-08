import { jest } from '@jest/globals';
import type { D1Database, D1Result } from '@cloudflare/workers-types';

// Setup globals that would be available in a Cloudflare Worker environment
global.Request = jest.fn().mockImplementation((input, init) => {
  const url = typeof input === 'string' ? input : (input as { url: string }).url;
  const method = (init && (init as { method?: string }).method) || 'GET';
  const headers = new Map(Object.entries((init && (init as { headers?: any }).headers) || {}));
  return {
    url,
    method,
    headers,
    cf: {},
  };
}) as unknown as typeof Request;

global.Response = jest.fn().mockImplementation((body, init) => {
  const status = (init && (init as { status?: number }).status) || 200;
  const headers = new Map(Object.entries((init && (init as { headers?: any }).headers) || {}));
  return {
    body,
    status,
    headers,
  };
}) as unknown as typeof Response;

// Define our own KVNamespace interface that matches what we need
interface KVNamespaceGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  cacheTtl?: number;
}

interface KVNamespaceListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface KVNamespaceListResult<T> {
  keys: { name: string; expiration?: number; metadata?: T }[];
  list_complete: boolean;
  cursor?: string;
}

interface KVNamespaceGetWithMetadataResult<T, M> {
  value: T | null;
  metadata: M | null;
}

interface MockKVNamespace {
  get(key: string, options?: Partial<KVNamespaceGetOptions>): Promise<string | null>;
  put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>>;
  getWithMetadata<T = unknown>(key: string): Promise<KVNamespaceGetWithMetadataResult<string, T>>;
}

// Mock D1 Database types
export interface MockD1PreparedStatement {
  bind: (...args: any[]) => MockD1PreparedStatement;
  first: <T = any>() => Promise<T | null>;
  run: <T = any>() => Promise<D1Result<T>>;
  all: <T = any>() => Promise<D1Result<T>>;
  raw: <T = any>() => Promise<[string[], ...T[]]>;
}

export interface MockD1Database extends D1Database {
  prepare: (query: string) => MockD1PreparedStatement;
}

// Create mock D1 database
const createMockPreparedStatement = () => {
  const statement = {
    bind: jest.fn().mockImplementation(function(this: any) { return this }),
    first: jest.fn().mockImplementation(() => Promise.resolve(null)),
    run: jest.fn().mockImplementation(() => Promise.resolve({
      success: true,
      results: [],
      meta: {
        duration: 0,
        changes: 0,
        served_by: 'test',
        last_row_id: 0,
        changed_db: false,
        size_after: 0,
        rows_read: 0,
        rows_written: 0
      }
    })),
    all: jest.fn().mockImplementation(() => Promise.resolve({
      results: [],
      success: true,
      meta: {
        duration: 0,
        changes: 0,
        served_by: 'test',
        last_row_id: 0,
        changed_db: false,
        size_after: 0,
        rows_read: 0,
        rows_written: 0
      }
    })),
    raw: jest.fn().mockImplementation(() => Promise.resolve([[''], []]))
  };
  return statement as MockD1PreparedStatement;
};

export const createMockD1Database = () => {
  const db = {
    prepare: jest.fn().mockImplementation(() => createMockPreparedStatement()),
    dump: jest.fn().mockImplementation(() => Promise.resolve(new ArrayBuffer(0))),
    batch: jest.fn().mockImplementation(() => Promise.resolve([])),
    exec: jest.fn().mockImplementation(() => Promise.resolve({
      success: true,
      results: [],
      meta: {
        duration: 0,
        changes: 0,
        served_by: 'test',
        last_row_id: 0,
        changed_db: false,
        size_after: 0,
        rows_read: 0,
        rows_written: 0
      }
    }))
  };
  return db as unknown as D1Database;
};

// Create mock KV namespace
export const createMockKVNamespace = () => {
  const kv = {
    get: jest.fn().mockImplementation(() => Promise.resolve(null)),
    put: jest.fn().mockImplementation(() => Promise.resolve()),
    delete: jest.fn().mockImplementation(() => Promise.resolve()),
    list: jest.fn().mockImplementation(() => Promise.resolve({ keys: [], list_complete: true, cursor: '' })),
    getWithMetadata: jest.fn().mockImplementation(() => Promise.resolve({ value: null, metadata: null }))
  };
  return kv as unknown as MockKVNamespace;
};

// Create mock execution context
export const createMockExecutionContext = () => {
  const ctx = {
    waitUntil: jest.fn(),
    passThroughOnException: jest.fn(),
    props: {}
  };
  return ctx as ExecutionContext;
};