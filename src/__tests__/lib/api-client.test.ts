import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import apiClient from '../../lib/api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Add missing logging methods to apiClient
apiClient.logInfo = jest.fn();
apiClient.logError = jest.fn();
apiClient.logWarning = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReleases', () => {
    it('should fetch releases without filters', async () => {
      const mockReleases = [{ id: 1, version: '1.0.0' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockReleases })
      });

      const result = await apiClient.getReleases();
      expect(result).toEqual(mockReleases);
      expect(fetch).toHaveBeenCalledWith('/releases', { params: undefined });
    });

    it('should fetch releases with filters', async () => {
      const filters = { platform: 'win', channel: 'stable' };
      const mockReleases = [{ id: 1, version: '1.0.0', ...filters }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockReleases })
      });

      const result = await apiClient.getReleases(filters);
      expect(result).toEqual(mockReleases);
      expect(fetch).toHaveBeenCalledWith('/releases', { params: filters });
    });
  });

  describe('updateReleaseStatus', () => {
    it('should update release status', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockResponse })
      });

      const result = await apiClient.updateReleaseStatus(1, true);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/releases/1', {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true })
      });
    });
  });

  describe('createRelease', () => {
    it('should create a new release', async () => {
      const newRelease = {
        version: '1.0.0',
        platform: 'win',
        channel: 'stable'
      };
      const mockResponse = { id: 1, ...newRelease };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockResponse })
      });

      const result = await apiClient.createRelease(newRelease);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/releases', {
        method: 'POST',
        body: JSON.stringify(newRelease)
      });
    });
  });

  describe('getStats', () => {
    it('should fetch statistics', async () => {
      const mockStats = { totalReleases: 10, activeReleases: 5 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      });

      const result = await apiClient.getStats();
      expect(result).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith('/stats');
    });
  });

  describe('getLogs', () => {
    it('should fetch logs with filters', async () => {
      const filters = {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        platform: 'win',
        channel: 'stable'
      };
      const mockLogs = [{ id: 1, timestamp: '2025-01-01', version: '1.0.0' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLogs })
      });

      const result = await apiClient.getLogs(filters);
      expect(result).toEqual(mockLogs);
      expect(fetch).toHaveBeenCalledWith('/logs', { params: filters });
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(apiClient.getReleases()).rejects.toThrow('Internal Server Error');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(apiClient.getReleases()).rejects.toThrow('Network error');
    });
  });
});