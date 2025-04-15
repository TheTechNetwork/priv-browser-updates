// Legacy Fine.dev client - being replaced with GitHub authentication
// import { FineClient } from "@fine-dev/fine-js";
import type { Schema } from "./db-types.ts";
import { api } from "./auth";

// Mock implementation to replace Fine.dev client
class MockFineClient<T> {
  constructor(private baseUrl: string) {}

  // Table method to match the Fine.dev API
  table<K extends keyof T>(tableName: K) {
    return {
      select: () => {
        return {
          eq: (field: string, value: any) => {
            return {
              eq: (field2: string, value2: any) => {
                return {
                  eq: (field3: string, value3: any) => {
                    return this.query(tableName);
                  },
                  length: 0 // Mock empty result
                };
              }
            };
          }
        };
      },
      insert: (data: Partial<T[K]>) => {
        return this.create(tableName, data);
      },
      update: (data: Partial<T[K]>) => {
        return {
          eq: (field: string, value: any) => {
            return {
              select: () => this.update(tableName, value, data)
            };
          }
        };
      }
    };
  }

  async query<K extends keyof T>(
    collection: K,
    options?: any
  ): Promise<T[K][]> {
    try {
      const response = await api.get(`/${String(collection)}`);
      return response as T[K][];
    } catch (error) {
      console.error(`Error querying ${String(collection)}:`, error);
      return [] as unknown as T[K][];
    }
  }

  async get<K extends keyof T>(
    collection: K,
    id: string
  ): Promise<T[K] | null> {
    try {
      const response = await api.get(`/${String(collection)}/${id}`);
      return response as T[K];
    } catch (error) {
      console.error(`Error getting ${String(collection)}/${id}:`, error);
      return null;
    }
  }

  async create<K extends keyof T>(
    collection: K,
    data: Partial<T[K]>
  ): Promise<T[K]> {
    try {
      const response = await api.post(`/${String(collection)}`, data);
      return response as T[K];
    } catch (error) {
      console.error(`Error creating ${String(collection)}:`, error);
      throw error;
    }
  }

  async update<K extends keyof T>(
    collection: K,
    id: string,
    data: Partial<T[K]>
  ): Promise<T[K]> {
    try {
      const response = await api.put(`/${String(collection)}/${id}`, data);
      return response as T[K];
    } catch (error) {
      console.error(`Error updating ${String(collection)}/${id}:`, error);
      throw error;
    }
  }

  async delete<K extends keyof T>(collection: K, id: string): Promise<void> {
    try {
      await api.delete(`/${String(collection)}/${id}`);
    } catch (error) {
      console.error(`Error deleting ${String(collection)}/${id}:`, error);
      throw error;
    }
  }
}

export const fine = new MockFineClient<Schema>("https://api.example.com");