import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '@/pages/settings';
import { apiClient } from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock layout components
jest.mock('@/components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

const mockSettings = {
  stableChannel: true,
  betaChannel: false,
  devChannel: false,
};

describe('Settings Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const setup = () => {
    const user = userEvent.setup();
    const utils = render(
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Settings />
      </QueryClientProvider>
    );
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockSettings });
    (apiClient.put as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('renders settings page with initial config', async () => {
    setup();

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      // There are multiple elements with this text, so use getAllByText
      expect(screen.getAllByText(/update channels/i).length).toBeGreaterThan(0);
    });

    // Verify channels state
    const stableSwitch = screen.getByRole('switch', { name: /stable channel/i });
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    const devSwitch = screen.getByRole('switch', { name: /dev channel/i });

    expect(stableSwitch).toBeChecked();
    expect(betaSwitch).not.toBeChecked();
    expect(devSwitch).not.toBeChecked();
  });

  it('handles channel toggle correctly', async () => {
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /beta channel/i })).toBeInTheDocument();
    });

    // Toggle beta channel
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    await user.click(betaSwitch);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Verify API call
    expect(apiClient.put).toHaveBeenCalledWith('/api/settings', {
      ...mockSettings,
      betaChannel: true,
    });

    // Should show success message (toast may be rendered in a portal, so check document.body)
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/settings saved/i);
    });
  });

  it('handles multiple channel toggles', async () => {
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /beta channel/i })).toBeInTheDocument();
    });

    // Toggle multiple channels
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    const devSwitch = screen.getByRole('switch', { name: /dev channel/i });

    await user.click(betaSwitch);
    await user.click(devSwitch);

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Verify API call with all changes
    expect(apiClient.put).toHaveBeenCalledWith('/api/settings', {
      ...mockSettings,
      betaChannel: true,
      devChannel: true,
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Failed to save settings'));
    
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /beta channel/i })).toBeInTheDocument();
    });

    // Toggle beta channel
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    await user.click(betaSwitch);

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Should show error message (toast may be rendered in a portal, so check document.body)
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/failed to save settings/i);
    });
  });

  it('disables save button while saving', async () => {
    // Make the API call take some time
    (apiClient.put as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({}), 1000))
    );

    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /beta channel/i })).toBeInTheDocument();
    });

    // Toggle a channel
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    await user.click(betaSwitch);

    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Button should be disabled and show loading state
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('maintains form state after failed save', async () => {
    // Mock API error
    (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Failed to save settings'));
    
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /beta channel/i })).toBeInTheDocument();
    });

    // Toggle channels
    const betaSwitch = screen.getByRole('switch', { name: /beta channel/i });
    const devSwitch = screen.getByRole('switch', { name: /dev channel/i });
    
    await user.click(betaSwitch);
    await user.click(devSwitch);

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Switches should maintain their toggled state after error
    await waitFor(() => {
      expect(betaSwitch).toBeChecked();
      expect(devSwitch).toBeChecked();
    });
  });
});