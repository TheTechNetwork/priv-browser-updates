import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

describe('Header Component', () => {
  const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: jest.fn(),
    });
  });

  it('renders logo and navigation', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays user information when logged in', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByAltText(/avatar/i)).toHaveAttribute('src', mockUser.avatarUrl);
  });

  it('shows theme toggle button', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const themeToggle = screen.getByLabelText(/toggle theme/i);
    expect(themeToggle).toBeInTheDocument();

    await user.click(themeToggle);
    // Theme state is tested in theme-provider.test.tsx
  });

  it('handles user menu interactions', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut,
    });

    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Open user menu
    const menuButton = screen.getByLabelText(/user menu/i);
    await user.click(menuButton);

    // Click sign out
    const signOutButton = screen.getByText(/sign out/i);
    await user.click(signOutButton);

    expect(signOut).toHaveBeenCalled();
  });

  it('displays notification badge when updates are available', () => {
    render(
      <ThemeProvider>
        <Header hasUpdates={true} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
  });

  it('hides notification badge when no updates', () => {
    render(
      <ThemeProvider>
        <Header hasUpdates={false} />
      </ThemeProvider>
    );

    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('makes logo link to dashboard for authenticated users', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const logoLink = screen.getByRole('link', { name: /logo/i });
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  it('shows mobile menu on smaller screens', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const mobileMenuButton = screen.getByLabelText(/menu/i);
    await user.click(mobileMenuButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('navigates to settings page', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    const menuButton = screen.getByLabelText(/user menu/i);
    await user.click(menuButton);

    const settingsLink = screen.getByText(/settings/i);
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('closes mobile menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Open mobile menu
    const mobileMenuButton = screen.getByLabelText(/menu/i);
    await user.click(mobileMenuButton);

    // Click outside
    await user.click(document.body);

    // Menu should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation in user menu', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Open user menu
    const menuButton = screen.getByLabelText(/user menu/i);
    await user.click(menuButton);

    // Navigate with keyboard
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Menu should close after selection
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('maintains accessibility attributes', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Site header');
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main');
  });
});