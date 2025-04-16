import React from 'react';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../../hooks/use-mobile';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useIsMobile hook', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
    window.innerWidth = 1024; // Default to desktop size
  });

  it('should return false for desktop viewport', () => {
    // Setup matchMedia to return false (desktop)
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile viewport', () => {
    // Setup matchMedia to return true (mobile)
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    // Set window.innerWidth to a mobile size
    window.innerWidth = 500;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should add and remove event listener', () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();

    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener,
    }));

    const { unmount } = renderHook(() => useIsMobile());
    
    // Check that addEventListener was called
    expect(addEventListener).toHaveBeenCalled();
    
    // Unmount the hook
    unmount();
    
    // Check that removeEventListener was called
    expect(removeEventListener).toHaveBeenCalled();
  });
});