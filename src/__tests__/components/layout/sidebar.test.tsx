import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/use-auth';

// Mock auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

describe('Sidebar Component', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
  };

  const setup = (isAuthenticated = true) => {
    (useAuth as jest.Mock).mockReturnValue({
      user: isAuthenticated ? mockUser : null,
      isAuthenticated,
    });

    const user = userEvent.setup();
    const utils = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/releases/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/logs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
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

    // Find collapse button
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    
    // Initial state - expanded
    expect(screen.getByText(/dashboard/i)).toBeVisible();
    
    // Click to collapse
    await user.click(collapseButton);
    
    // Sidebar should be collapsed
    expect(screen.getByText(/dashboard/i)).not.toBeVisible();
    
    // Click to expand again
    await user.click(collapseButton);
    
    // Sidebar should be expanded
    expect(screen.getByText(/dashboard/i)).toBeVisible();
  });

  it('shows tooltips for navigation items when collapsed', async () => {
    const { user } = setup();

    // Collapse sidebar
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    await user.click(collapseButton);

    // Hover over Dashboard icon
    await user.hover(screen.getByTestId('dashboard-icon'));

    // Check if tooltip appears
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
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

    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    await user.click(collapseButton);

    // Check if state is saved in localStorage
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');

    // Reload component
    setup();

    // Sidebar should still be collapsed
    expect(screen.getByText(/dashboard/i)).not.toBeVisible();
  });
});