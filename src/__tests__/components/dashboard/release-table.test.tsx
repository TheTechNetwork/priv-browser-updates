import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReleaseTable } from '@/components/dashboard/release-table';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// Mock API client
jest.mock('@/lib/api-client', () => ({
  getReleases: jest.fn(),
  updateReleaseStatus: jest.fn(),
}));

const mockReleases = [
  {
    id: 1,
    version: '1.0.0',
    platform: 'win',
    channel: 'stable',
    downloadUrl: 'https://example.com/1.0.0',
    isActive: true,
    releaseDate: '2025-01-01',
    size: 1024 * 1024 * 100, // 100MB
    sha256: 'abc123',
  },
  {
    id: 2,
    version: '1.1.0-beta',
    platform: 'win',
    channel: 'beta',
    downloadUrl: 'https://example.com/1.1.0-beta',
    isActive: false,
    releaseDate: '2025-01-02',
    size: 1024 * 1024 * 110, // 110MB
    sha256: 'def456',
  },
];

describe('ReleaseTable Component', () => {
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
        <ReleaseTable />
      </QueryClientProvider>
    );
    return {
      user,
      ...utils,
    };
  };

  beforeEach(() => {
    (apiClient.getReleases as jest.Mock).mockResolvedValue(mockReleases);
    (apiClient.updateReleaseStatus as jest.Mock).mockResolvedValue({ success: true });
    queryClient.clear();
  });

  it('renders release table with correct columns', async () => {
    setup();

    // Wait for data to load
    expect(await screen.findByText('1.0.0')).toBeInTheDocument();

    // Check for all columns
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(8); // Version, Platform, Channel, Status, Size, Date, Hash, Actions

    // Check column labels
    expect(screen.getByText(/version/i)).toBeInTheDocument();
    expect(screen.getByText(/platform/i)).toBeInTheDocument();
    expect(screen.getByText(/channel/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('displays release data correctly', async () => {
    setup();

    // Wait for table to load
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');

    // Check first row data (excluding header)
    const firstRow = rows[1];
    expect(within(firstRow).getByText('1.0.0')).toBeInTheDocument();
    expect(within(firstRow).getByText('win')).toBeInTheDocument();
    expect(within(firstRow).getByText('stable')).toBeInTheDocument();
    expect(within(firstRow).getByText('100 MB')).toBeInTheDocument();
  });

  it('handles release status toggle', async () => {
    const { user } = setup();

    // Wait for table to load
    await screen.findByText('1.0.0');

    // Find and click the first toggle
    const toggles = screen.getAllByRole('switch');
    await user.click(toggles[0]);

    // Verify API call
    expect(apiClient.updateReleaseStatus).toHaveBeenCalledWith(1, false);
  });

  it('sorts releases by version', async () => {
    const { user } = setup();

    // Wait for table to load
    await screen.findByText('1.0.0');

    // Click version header to sort
    const versionHeader = screen.getByText(/version/i);
    await user.click(versionHeader);

    // Get all version cells
    const cells = screen.getAllByRole('cell');
    const versions = cells
      .map(cell => cell.textContent)
      .filter(text => /^\d+\.\d+\.\d+/.test(text || ''));

    // Verify sort order
    expect(versions).toEqual(['1.1.0-beta', '1.0.0']); // Descending order
  });

  it('filters releases by platform and channel', async () => {
    const { user } = setup();

    // Wait for table to load
    await screen.findByText('1.0.0');

    // Find filter inputs
    const platformFilter = screen.getByPlaceholderText(/filter platform/i);
    await user.type(platformFilter, 'win');

    // Verify filtered results
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('1.1.0-beta')).toBeInTheDocument();

    // Filter by channel
    const channelFilter = screen.getByPlaceholderText(/filter channel/i);
    await user.type(channelFilter, 'stable');

    // Verify filtered results
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.queryByText('1.1.0-beta')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock loading state by not resolving the promise
    (apiClient.getReleases as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    setup();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock API error
    (apiClient.getReleases as jest.Mock).mockRejectedValue(new Error('Failed to load releases'));
    
    setup();

    expect(await screen.findByText(/failed to load releases/i)).toBeInTheDocument();
  });

  it('paginates data correctly', async () => {
    const { user } = setup();

    // Wait for table to load
    await screen.findByText('1.0.0');

    // Check initial page
    expect(screen.getByText('Page 1')).toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Verify page change
    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });

  it('allows copying release hash', async () => {
    const { user } = setup();
    const mockClipboard = {
      writeText: jest.fn()
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    // Wait for table to load
    await screen.findByText('1.0.0');

    // Find and click hash copy button
    const copyButton = screen.getByRole('button', { name: /copy hash/i });
    await user.click(copyButton);

    // Verify clipboard write
    expect(mockClipboard.writeText).toHaveBeenCalledWith('abc123');
  });

  const mockReleasesNew = [
    {
      id: '1',
      version: '1.2.0',
      releaseDate: '2025-05-01T00:00:00Z',
      status: 'published',
      changelog: '- Feature A\n- Bug fix B',
      downloadUrl: 'https://example.com/v1.2.0',
      installCount: 1500,
      targetPlatform: 'windows',
    },
    {
      id: '2',
      version: '1.1.0',
      releaseDate: '2025-04-15T00:00:00Z',
      status: 'archived',
      changelog: '- Feature C',
      downloadUrl: 'https://example.com/v1.1.0',
      installCount: 2000,
      targetPlatform: 'macos',
    },
  ];

  const mockHandlers = {
    onPublish: jest.fn(),
    onArchive: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders release table with data', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(mockReleasesNew.length + 1); // +1 for header
    expect(screen.getByText('1.2.0')).toBeInTheDocument();
    expect(screen.getByText('1.1.0')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByText(/May 1, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/April 15, 2025/)).toBeInTheDocument();
  });

  it('shows status badges with correct styles', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    const publishedBadge = screen.getByText('published');
    const archivedBadge = screen.getByText('archived');

    expect(publishedBadge).toHaveClass('bg-green-100');
    expect(archivedBadge).toHaveClass('bg-gray-100');
  });

  it('handles row actions', async () => {
    const user = userEvent.setup();
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    // Open actions menu for first row
    const firstRow = screen.getAllByRole('row')[1];
    const actionsButton = within(firstRow).getByLabelText(/actions/i);
    await user.click(actionsButton);

    // Test archive action
    const archiveButton = screen.getByText(/archive/i);
    await user.click(archiveButton);
    expect(mockHandlers.onArchive).toHaveBeenCalledWith(mockReleasesNew[0]);

    // Test edit action
    await user.click(actionsButton);
    const editButton = screen.getByText(/edit/i);
    await user.click(editButton);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockReleasesNew[0]);
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => true);

    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    // Open actions menu
    const actionsButton = screen.getAllByLabelText(/actions/i)[0];
    await user.click(actionsButton);

    // Click delete
    const deleteButton = screen.getByText(/delete/i);
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockReleasesNew[0]);
  });

  it('cancels delete when confirmed false', async () => {
    const user = userEvent.setup();
    window.confirm = jest.fn(() => false);

    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    // Open actions menu
    const actionsButton = screen.getAllByLabelText(/actions/i)[0];
    await user.click(actionsButton);

    // Click delete
    const deleteButton = screen.getByText(/delete/i);
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
  });

  it('displays install counts with proper formatting', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
  });

  it('shows platform icons', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByTitle(/windows/i)).toBeInTheDocument();
    expect(screen.getByTitle(/macos/i)).toBeInTheDocument();
  });

  it('displays changelog content', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByText(/Feature A/)).toBeInTheDocument();
    expect(screen.getByText(/Bug fix B/)).toBeInTheDocument();
  });

  it('provides download links', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    const downloadLinks = screen.getAllByRole('link', { name: /download/i });
    expect(downloadLinks[0]).toHaveAttribute('href', mockReleasesNew[0].downloadUrl);
    expect(downloadLinks[1]).toHaveAttribute('href', mockReleasesNew[1].downloadUrl);
  });

  it('sorts releases by date descending by default', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    const rows = screen.getAllByRole('row');
    const firstVersionCell = within(rows[1]).getByText(mockReleasesNew[0].version);
    const secondVersionCell = within(rows[2]).getByText(mockReleasesNew[1].version);

    expect(firstVersionCell).toBeInTheDocument();
    expect(secondVersionCell).toBeInTheDocument();
  });

  it('handles empty releases array', () => {
    render(<ReleaseTable releases={[]} {...mockHandlers} />);

    expect(screen.getByText(/no releases found/i)).toBeInTheDocument();
  });

  it('maintains accessibility roles and labels', () => {
    render(<ReleaseTable releases={mockReleasesNew} {...mockHandlers} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Release versions');
    expect(screen.getAllByRole('columnheader')).toHaveLength(7); // Version, Date, Status, Platform, Install Count, Changelog, Actions
  });
});