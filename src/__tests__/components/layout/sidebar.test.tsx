import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/use-auth';

// Mock auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as unknown as jest.Mock;

describe('Sidebar Component', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  const setup = (isAuthenticated = true) => {
    mockedUseAuth.mockReturnValue({
      user: isAuthenticated ? mockUser : null,
      isAuthenticated,
    });

    const user = userEvent.setup();
    const utils = render(
      <BrowserRouter>
        <AppSidebar isAuthenticated={isAuthenticated} />
      </BrowserRouter>
    );

    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = (function () {
      let store: Record<string, string> = {};
      return {
        getItem(key: string) {
          return store[key] || null;
        },
        setItem(key: string, value: string) {
          store[key] = value.toString();
        },
        clear() {
          store = {};
        },
        removeItem(key: string) {
          delete store[key];
        },
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('renders sidebar with navigation items when authenticated', () => {
    setup();

    // Check for main navigation items
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/releases/i)).toBeInTheDocument();
    expect(screen.getByText(/logs/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('shows user profile when authenticated', () => {
    setup();
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('does not render navigation items when not authenticated', () => {
    setup(false);
    // Navigation items should not be present
    expect(screen.queryByTestId('dashboard-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('releases-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('logs-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-icon')).not.toBeInTheDocument();
  });

  it('highlights active navigation item', async () => {
    const { user } = setup();

    // Click on Releases link
    const releasesLink = screen.getByText(/releases/i);
    await user.click(releasesLink);

    // Check if Releases link has active class
    expect(releasesLink.closest('a')).toHaveClass('active');
  });

  it('toggles sidebar collapse state', async () => {
    const { user } = setup();
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    // Initial state - expanded
    expect(screen.getByText(/dashboard/i)).toBeVisible();
    // Collapse sidebar
    await user.click(collapseButton);
    // Sidebar should be collapsed: text is hidden, but icon link remains
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    // Expand again
    await user.click(collapseButton);
    expect(screen.getByText(/dashboard/i)).toBeVisible();
  });

  it('shows tooltips for navigation items when collapsed', async () => {
    const { user } = setup();
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    await user.click(collapseButton);
    // The text is hidden, but the icon link remains with a title attribute
    const dashboardLink = screen.getByTestId('dashboard-icon');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('title', 'Dashboard');
  });

  it('renders correct icons for each navigation item', () => {
    setup();

    // Check for presence of icons
    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('releases-icon')).toBeInTheDocument();
    expect(screen.getByTestId('logs-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('handles navigation correctly', async () => {
    const { user } = setup();

    // Click on different navigation items
    await user.click(screen.getByText(/releases/i));
    expect(window.location.pathname).toBe('/releases');

    await user.click(screen.getByText(/logs/i));
    expect(window.location.pathname).toBe('/logs');

    await user.click(screen.getByText(/settings/i));
    expect(window.location.pathname).toBe('/settings');
  });

  it('persists collapsed state in localStorage', async () => {
    const { user } = setup();
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    await user.click(collapseButton);
    await waitFor(() => {
      expect(window.localStorage.getItem('sidebar-collapsed')).toBe('true');
    });
  });
});