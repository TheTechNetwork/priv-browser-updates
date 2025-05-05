import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { useTheme } from '@/components/layout/use-theme';

describe('Theme Provider and Hook', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
  });

  // Test component that uses the theme hook
  const TestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
      <div>
        <span data-testid="current-theme">{theme}</span>
        <button onClick={() => setTheme('dark')}>Set Dark</button>
        <button onClick={() => setTheme('light')}>Set Light</button>
        <button onClick={() => setTheme('system')}>Set System</button>
      </div>
    );
  };

  it('provides default theme value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  it('loads saved theme from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('updates theme when changed', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('removes dark class when switching to light theme', async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Light'));
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('handles system theme preference', async () => {
    const user = userEvent.setup();
    
    // Mock system dark mode preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set System'));
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('updates theme when system preference changes', () => {
    let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
    
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_, listener) => {
        darkModeListener = listener;
      },
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Simulate system theme change
    if (darkModeListener) {
      darkModeListener(new MediaQueryListEvent('change', { matches: true }));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }
  });

  it('cleans up media query listener on unmount', () => {
    const removeEventListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener,
      dispatchEvent: jest.fn(),
    }));

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });

  it('provides theme through context', () => {
    const ConsumerComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme-value">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toBeInTheDocument();
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('persists theme choice across remounts', async () => {
    const user = userEvent.setup();
    
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));
    unmount();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });
});