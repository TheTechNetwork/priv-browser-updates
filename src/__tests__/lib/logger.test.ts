import { logger } from '@/lib/logger';
import apiClient from '@/lib/api-client';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
}));

describe('Logger', () => {
  // Mock console methods
  const originalConsole = { ...console };
  
  beforeEach(() => {
    // Reset console mocks
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  describe('info logging', () => {
    it('logs info messages to console', () => {
      logger.info('Test info message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('sends info logs to API', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('API info message', context);
      
      expect(apiClient.logInfo).toHaveBeenCalledWith({
        message: 'API info message',
        context,
        timestamp: expect.any(String),
      });
    });

    it('handles objects in info messages', () => {
      const testObj = { key: 'value' };
      logger.info('Object test', testObj);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Object test'),
        testObj
      );
    });
  });

  describe('error logging', () => {
    it('logs errors to console', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        error
      );
    });

    it('sends errors to API', () => {
      const error = new Error('API error');
      logger.error('API error occurred', error);
      
      expect(apiClient.logError).toHaveBeenCalledWith({
        message: 'API error occurred',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        timestamp: expect.any(String),
      });
    });

    it('handles error context', () => {
      const error = new Error('Context error');
      const context = { component: 'TestComponent' };
      logger.error('Error with context', error, context);
      
      expect(apiClient.logError).toHaveBeenCalledWith({
        message: 'Error with context',
        error: expect.any(Object),
        context,
        timestamp: expect.any(String),
      });
    });
  });

  describe('warning logging', () => {
    it('logs warnings to console', () => {
      logger.warn('Test warning');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning')
      );
    });

    it('sends warnings to API', () => {
      const context = { source: 'test' };
      logger.warn('API warning', context);
      
      expect(apiClient.logWarning).toHaveBeenCalledWith({
        message: 'API warning',
        context,
        timestamp: expect.any(String),
      });
    });
  });

  describe('log formatting', () => {
    it('includes timestamp in log messages', () => {
      logger.info('Timestamped message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/)
      );
    });

    it('formats error stacks properly', () => {
      const error = new Error('Stack test');
      logger.error('Error with stack', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error with stack'),
        expect.objectContaining({
          stack: expect.stringContaining('Error: Stack test')
        })
      );
    });
  });

  describe('log filtering', () => {
    it('respects log level settings', () => {
      // Set log level to ERROR
      logger.setLevel('ERROR');
      
      logger.info('Should not log');
      logger.error('Should log');
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles invalid log levels gracefully', () => {
      // @ts-expect-error - Testing invalid log level
      logger.setLevel('INVALID');
      
      logger.info('Should still work');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('API integration', () => {
    it('retries failed API log submissions', async () => {
      // Mock API failure then success
      (apiClient.logError as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });
      
      const error = new Error('Retry test');
      await logger.error('Testing retries', error);
      
      expect(apiClient.logError).toHaveBeenCalledTimes(2);
    });

    it('handles API timeouts', async () => {
      // Mock API timeout
      (apiClient.logError as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      const error = new Error('Timeout test');
      await logger.error('Testing timeout', error);
      
      // Should still log to console even if API times out
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('batch logging', () => {
    it('batches multiple logs together', async () => {
      logger.startBatch();
      
      logger.info('Log 1');
      logger.info('Log 2');
      logger.info('Log 3');
      
      await logger.flushBatch();
      
      // Should send all logs in one API call
      expect(apiClient.logInfo).toHaveBeenCalledTimes(1);
      expect(apiClient.logInfo).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Log 1' }),
          expect.objectContaining({ message: 'Log 2' }),
          expect.objectContaining({ message: 'Log 3' })
        ])
      );
    });

    it('handles mixed log levels in batch', async () => {
      logger.startBatch();
      
      logger.info('Info log');
      logger.warn('Warning log');
      logger.error('Error log', new Error('Test'));
      
      await logger.flushBatch();
      
      expect(apiClient.logInfo).toHaveBeenCalled();
      expect(apiClient.logWarning).toHaveBeenCalled();
      expect(apiClient.logError).toHaveBeenCalled();
    });
  });
});