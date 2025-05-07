import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReleaseTable } from '@/components/dashboard/release-table';
import type { Schema } from '@/lib/db-types';
import '@testing-library/jest-dom';

type Release = Schema['releases'];

const mockReleases: Release[] = [
  {
    id: 1,
    version: '1.0.0',
    channel: 'stable',
    platform: 'win',
    downloadUrl: 'https://example.com/download/1.0.0',
    releaseNotes: 'Initial release',
    fileSize: 1024 * 1024, // 1MB
    sha256: 'abc123',
    createdAt: '2025-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 2,
    version: '1.1.0-beta',
    channel: 'beta',
    platform: 'mac',
    downloadUrl: 'https://example.com/download/1.1.0',
    releaseNotes: 'Beta release',
    fileSize: 2048 * 1024, // 2MB
    sha256: 'def456',
    createdAt: '2025-01-02T00:00:00Z',
    isActive: false
  }
];

describe('ReleaseTable', () => {
  const mockHandlers = {
    onToggleStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders release table with data', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(mockReleases.length + 1); // +1 for header
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('1.1.0-beta')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    // The component uses formatDistanceToNow, which outputs relative dates like '4 months ago'.
    // We'll check for the presence of 'ago' in the rendered output for both releases.
    const createdCells = screen.getAllByText(/ago$/);
    expect(createdCells.length).toBeGreaterThanOrEqual(2);
  });

  it('shows status badges with correct styles', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    expect(screen.getByText('Active')).toHaveClass('bg-primary');
    expect(screen.getByText('Inactive')).toHaveClass('bg-secondary');
  });

  it('handles release status toggle', async () => {
    const user = userEvent.setup();
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    // Find and click status toggle in dropdown
    const actionsButton = screen.getAllByRole('button', { name: /open menu/i })[0];
    await user.click(actionsButton);
    
    const toggleButton = screen.getByRole('menuitem', { name: /deactivate/i });
    await user.click(toggleButton);

    expect(mockHandlers.onToggleStatus).toHaveBeenCalledWith(mockReleases[0]);
  });

  it('displays file sizes in human readable format', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
  });

  it('shows platform badges', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    const winBadge = screen.getByText('win');
    const macBadge = screen.getByText('mac');

    expect(winBadge).toBeInTheDocument();
    expect(macBadge).toBeInTheDocument();
    expect(winBadge).toHaveClass('capitalize');
    expect(macBadge).toHaveClass('capitalize');
  });

  it('provides download links when available', () => {
    render(<ReleaseTable releases={mockReleases} onToggleStatus={mockHandlers.onToggleStatus} />);

    const actionsButtons = screen.getAllByRole('button', { name: /open menu/i });
    expect(actionsButtons).toHaveLength(2);

    // TODO: Add test for clicking download link once we implement proper dropdown testing
  });
});