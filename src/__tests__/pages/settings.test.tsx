import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '@/pages/settings';
import apiClient from '@/lib/api-client';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  getConfig: jest.fn(),
  updateConfig: jest.fn(),
}));

// Mock layout components
jest.mock('@/components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

const mockConfig = {
  githubToken: 'test-token',
  githubOwner: 'test-owner',
  githubRepo: 'test-repo',
  stableChannel: true,
  betaChannel: false,
  devChannel: false,
  syncInterval: 3600,
  autoSync: true,
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
        <Settings />
      </QueryClientProvider>
    );
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    (apiClient.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (apiClient.updateConfig as jest.Mock).mockResolvedValue({ ...mockConfig });
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
      expect(screen.getByText(/update channels/i)).toBeInTheDocument();
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
    expect(apiClient.updateConfig).toHaveBeenCalledWith({
      ...mockConfig,
      betaChannel: true,
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
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
    expect(apiClient.updateConfig).toHaveBeenCalledWith({
      ...mockConfig,
      betaChannel: true,
      devChannel: true,
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (apiClient.updateConfig as jest.Mock).mockRejectedValueOnce(new Error('Failed to save settings'));
    
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

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to save settings/i)).toBeInTheDocument();
    });
  });

  it('disables save button while saving', async () => {
    // Make the API call take some time
    (apiClient.updateConfig as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(mockConfig), 1000))
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
    (apiClient.updateConfig as jest.Mock).mockRejectedValueOnce(new Error('Failed to save settings'));
    
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