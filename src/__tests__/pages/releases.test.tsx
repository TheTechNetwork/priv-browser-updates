import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Releases from '@/pages/releases';
import apiClient from '@/lib/api-client';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  getReleases: jest.fn(),
  syncGitHubReleases: jest.fn(),
  updateReleaseStatus: jest.fn(),
}));

// Mock components that aren't necessary to test
jest.mock('@/components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="mock-footer">Footer</div>,
}));

const mockReleases = [
  {
    id: 1,
    version: '1.0.0',
    platform: 'win',
    channel: 'stable',
    downloadUrl: 'https://example.com/download/1.0.0',
    isActive: true,
  },
  {
    id: 2,
    version: '1.1.0-beta',
    platform: 'win',
    channel: 'beta',
    downloadUrl: 'https://example.com/download/1.1.0-beta',
    isActive: false,
  },
];

describe('Releases Page', () => {
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
        <Releases />
      </QueryClientProvider>
    );
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    (apiClient.getReleases as jest.Mock).mockResolvedValue(mockReleases);
    (apiClient.syncGitHubReleases as jest.Mock).mockResolvedValue({ success: true });
    (apiClient.updateReleaseStatus as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('renders the releases page with initial data', async () => {
    setup();

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    // Verify table content
    expect(screen.getByText('1.1.0-beta')).toBeInTheDocument();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('handles GitHub sync', async () => {
    const { user } = setup();

    await waitFor(() => {
      expect(screen.getByText(/sync releases/i)).toBeInTheDocument();
    });

    // Click sync button
    const syncButton = screen.getByText(/sync releases/i);
    await user.click(syncButton);

    // Verify sync was called
    expect(apiClient.syncGitHubReleases).toHaveBeenCalled();

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/successfully synchronized/i)).toBeInTheDocument();
    });
  });

  it('handles release status toggle', async () => {
    const { user } = setup();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    // Find and click the toggle
    const toggles = screen.getAllByRole('switch');
    await user.click(toggles[0]);

    // Verify API call
    expect(apiClient.updateReleaseStatus).toHaveBeenCalledWith(1, false);
  });

  it('filters releases correctly', async () => {
    const { user } = setup();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    // Filter by version
    const versionFilter = screen.getByPlaceholderText(/filter by version/i);
    await user.type(versionFilter, '1.1.0');

    // Should only show beta version
    expect(screen.queryByText('1.0.0')).not.toBeInTheDocument();
    expect(screen.getByText('1.1.0-beta')).toBeInTheDocument();

    // Filter by platform
    const platformSelect = screen.getByRole('combobox', { name: /platform/i });
    await user.click(platformSelect);
    await user.click(screen.getByText('Windows'));

    // Should maintain both filters
    expect(screen.getByText('1.1.0-beta')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    (apiClient.getReleases as jest.Mock).mockRejectedValueOnce(new Error('Failed to load releases'));
    
    setup();

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load releases/i)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const { user } = setup();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    // Clear mock calls
    (apiClient.getReleases as jest.Mock).mockClear();

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Verify API was called again
    expect(apiClient.getReleases).toHaveBeenCalled();
  });
});