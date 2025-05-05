import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiDocs from '@/pages/api-docs';
import { BrowserRouter } from 'react-router-dom';

describe('API Documentation Page', () => {
  const setup = () => {
    const user = userEvent.setup();
    const utils = render(
      <BrowserRouter>
        <ApiDocs />
      </BrowserRouter>
    );
    return {
      user,
      ...utils,
    };
  };

  it('renders main documentation sections', () => {
    setup();
    
    // Check for main sections
    expect(screen.getByText(/introduction/i)).toBeInTheDocument();
    expect(screen.getByText(/authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/endpoints/i)).toBeInTheDocument();
    expect(screen.getByText(/error handling/i)).toBeInTheDocument();
  });

  it('displays API endpoint details', () => {
    setup();
    
    // Check for endpoint documentation
    expect(screen.getByText('/api/releases')).toBeInTheDocument();
    expect(screen.getByText('/api/updates')).toBeInTheDocument();
    expect(screen.getByText('/api/config')).toBeInTheDocument();
    
    // Check for HTTP methods
    expect(screen.getAllByText('GET')).toHaveLength(3);
    expect(screen.getAllByText('POST')).toHaveLength(2);
    expect(screen.getAllByText('PUT')).toHaveLength(1);
  });

  it('shows code examples', async () => {
    const { user } = setup();
    
    // Find and click code example tabs
    const curlTab = screen.getByRole('tab', { name: /curl/i });
    await user.click(curlTab);
    
    // Check curl example
    expect(screen.getByText(/curl -X GET/i)).toBeInTheDocument();
    
    // Switch to JavaScript example
    const jsTab = screen.getByRole('tab', { name: /javascript/i });
    await user.click(jsTab);
    
    // Check JavaScript example
    expect(screen.getByText(/fetch/i)).toBeInTheDocument();
  });

  it('allows copying code examples', async () => {
    const { user } = setup();
    const mockClipboard = { writeText: jest.fn() };
    Object.assign(navigator, { clipboard: mockClipboard });

    // Find and click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    // Verify clipboard write
    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });

  it('displays API response schemas', () => {
    setup();
    
    // Check for schema documentation
    const schemas = screen.getByTestId('api-schemas');
    
    expect(within(schemas).getByText(/release object/i)).toBeInTheDocument();
    expect(within(schemas).getByText(/update check response/i)).toBeInTheDocument();
    expect(within(schemas).getByText(/error response/i)).toBeInTheDocument();
  });

  it('shows authentication requirements', () => {
    setup();
    
    // Check authentication documentation
    const authSection = screen.getByTestId('auth-section');
    
    expect(within(authSection).getByText(/api key/i)).toBeInTheDocument();
    expect(within(authSection).getByText(/bearer token/i)).toBeInTheDocument();
    expect(screen.getByText(/authorization: bearer/i)).toBeInTheDocument();
  });

  it('provides rate limiting information', () => {
    setup();
    
    const rateLimitSection = screen.getByTestId('rate-limit-section');
    
    expect(within(rateLimitSection).getByText(/requests per minute/i)).toBeInTheDocument();
    expect(within(rateLimitSection).getByText(/x-ratelimit-remaining/i)).toBeInTheDocument();
  });

  it('shows error responses', () => {
    setup();
    
    const errorSection = screen.getByTestId('error-section');
    
    // Check error status codes
    expect(within(errorSection).getByText('400')).toBeInTheDocument();
    expect(within(errorSection).getByText('401')).toBeInTheDocument();
    expect(within(errorSection).getByText('403')).toBeInTheDocument();
    expect(within(errorSection).getByText('429')).toBeInTheDocument();
    expect(within(errorSection).getByText('500')).toBeInTheDocument();
  });

  it('handles responsive layout', () => {
    const { container } = setup();
    
    // Check responsive classes
    expect(container.firstChild).toHaveClass('md:grid-cols-2');
    expect(screen.getByTestId('sidebar')).toHaveClass('md:block');
  });

  it('supports dark mode', () => {
    setup();
    document.documentElement.classList.add('dark');
    
    // Check dark mode styles
    expect(screen.getByTestId('code-examples')).toHaveClass('dark:bg-gray-900');
    expect(screen.getByTestId('endpoint-list')).toHaveClass('dark:border-gray-700');
  });

  it('maintains scroll position on tab change', async () => {
    const { user } = setup();
    
    // Scroll to bottom of a section
    const section = screen.getByTestId('endpoints-section');
    section.scrollTop = 1000;
    
    // Change code example tab
    const pythonTab = screen.getByRole('tab', { name: /python/i });
    await user.click(pythonTab);
    
    // Scroll position should be maintained
    expect(section.scrollTop).toBe(1000);
  });

  it('highlights active section in sidebar', async () => {
    const { user } = setup();
    
    // Click a section link
    const authLink = screen.getByRole('link', { name: /authentication/i });
    await user.click(authLink);
    
    // Link should be highlighted
    expect(authLink).toHaveClass('text-primary');
  });
});