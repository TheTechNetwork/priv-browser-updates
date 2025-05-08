import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_BREAKPOINT } from '@/lib/constants';
import '@testing-library/jest-dom';

describe('useIsMobile', () => {
  const matchMediaMock = jest.fn();

  beforeEach(() => {
    window.matchMedia = matchMediaMock;
  });

  it('should return false for desktop viewport', () => {
    // Mock desktop viewport
    window.innerWidth = MOBILE_BREAKPOINT + 100;
    matchMediaMock.mockImplementation(() => ({
      matches: false,
      media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    const { result } = renderHook(() => useIsMobile());
    
    act(() => {
      // Simulate the onChange call that sets the initial state
      matchMediaMock.mock.results[0].value.addEventListener.mock.calls[0][1]();
    });

    expect(result.current).toBe(false);
  });

  it("should return true for mobile viewport", () => {
    // Mock mobile viewport
    window.innerWidth = MOBILE_BREAKPOINT - 100;
    matchMediaMock.mockImplementation(() => ({
      matches: true,
      media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    const { result } = renderHook(() => useIsMobile());
    
    act(() => {
      // Simulate the onChange call that sets the initial state
      matchMediaMock.mock.results[0].value.addEventListener.mock.calls[0][1]();
    });

    expect(result.current).toBe(true);
  });

  it('should add and remove event listener', () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();

    matchMediaMock.mockImplementation(() => ({
      matches: false,
      media: `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
      addEventListener,
      removeEventListener,
    }));

    const { unmount } = renderHook(() => useIsMobile());
    expect(addEventListener).toHaveBeenCalled();
    
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});