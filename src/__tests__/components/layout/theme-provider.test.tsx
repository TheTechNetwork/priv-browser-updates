import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { useTheme } from '@/components/layout/theme-context';
import '@testing-library/jest-dom';

function TestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </>
  );
}

describe('ThemeProvider', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Reset mocks
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('uses default theme when no stored value exists', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  it('updates theme and localStorage when theme changes', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('handles system theme preference correctly', () => {
    // Mock matchMedia
    const matchMedia = jest.fn();
    window.matchMedia = matchMedia;

    // Mock dark mode preference
    matchMedia.mockReturnValue({
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('uses custom storage key when provided', async () => {
    const user = userEvent.setup();
    const customKey = 'custom-theme-key';

    render(
      <ThemeProvider storageKey={customKey}>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Set Dark'));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(customKey, 'dark');
  });
});