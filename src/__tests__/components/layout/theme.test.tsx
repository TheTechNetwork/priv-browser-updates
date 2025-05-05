import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { useTheme } from '@/components/layout/use-theme';

const ThemeConsumer = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
};

const TestComponent = () => (
  <ThemeProvider>
    <ThemeConsumer />
  </ThemeProvider>
);

describe('Theme System', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset system color scheme
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it('defaults to system theme', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
  });

  it('allows changing theme', async () => {
    const { user } = { user: userEvent.setup() };
    render(<TestComponent />);

    // Change to light theme
    await user.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    // Change to dark theme
    await user.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('persists theme preference', async () => {
    const { user } = { user: userEvent.setup() };
    const { unmount } = render(<TestComponent />);

    // Set theme
    await user.click(screen.getByText('Set Dark'));
    
    // Unmount and remount to test persistence
    unmount();
    render(<TestComponent />);

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('responds to system theme changes', async () => {
    // Mock system dark mode
    let darkModeListener: ((e: { matches: boolean }) => void) | null = null;
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn((_, listener) => {
        darkModeListener = listener;
      }),
      removeEventListener: jest.fn(),
    }));

    render(<TestComponent />);
    await user.click(screen.getByText('Set System'));

    // Simulate system dark mode change
    if (darkModeListener) {
      darkModeListener({ matches: true });
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });

      darkModeListener({ matches: false });
      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('dark');
      });
    }
  });

  it('applies theme class to document element', async () => {
    const { user } = { user: userEvent.setup() };
    render(<TestComponent />);

    // Set dark theme
    await user.click(screen.getByText('Set Dark'));
    expect(document.documentElement).toHaveClass('dark');

    // Set light theme
    await user.click(screen.getByText('Set Light'));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('handles invalid stored theme value', () => {
    // Set invalid theme in localStorage
    localStorage.setItem('theme', 'invalid-theme');
    
    render(<TestComponent />);
    
    // Should fall back to system theme
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
  });

  it('provides theme context to nested components', async () => {
    const { user } = { user: userEvent.setup() };
    const NestedConsumer = () => {
      const { theme } = useTheme();
      return <div data-testid="nested-theme">{theme}</div>;
    };

    render(
      <ThemeProvider>
        <div>
          <ThemeConsumer />
          <NestedConsumer />
        </div>
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));
    
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(screen.getByTestId('nested-theme')).toHaveTextContent('dark');
  });
});