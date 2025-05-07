import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { useTheme, ThemeProviderContext } from '@/components/layout/theme-context';
import '@testing-library/jest-dom';

describe('Theme Context', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('returns context value when used within provider', () => {
    const mockTheme = {
      theme: 'dark' as const,
      setTheme: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProviderContext.Provider value={mockTheme}>
        {children}
      </ThemeProviderContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.setTheme).toBe(mockTheme.setTheme);
  });
});