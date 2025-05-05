import { render, screen } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PrivateRoute, PublicRoute } from '@/components/auth/route-components';
import { useAuth } from '@/hooks/use-auth';

// Mock auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock components for testing
const PrivatePage = () => <div>Private Content</div>;
const PublicPage = () => <div>Public Content</div>;
const LoginPage = () => <div>Login Page</div>;

describe('Auth Route Components', () => {
  const mockNavigate = jest.fn();
  
  // Mock useNavigate
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PrivateRoute', () => {
    const renderPrivateRoute = (isAuthenticated: boolean) => {
      (useAuth as jest.Mock).mockReturnValue({ isAuthenticated });
      
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <PrivateRoute>
                <PrivatePage />
              </PrivateRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      );
    };

    it('renders children when authenticated', () => {
      renderPrivateRoute(true);
      expect(screen.getByText('Private Content')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', () => {
      renderPrivateRoute(false);
      expect(window.location.pathname).toBe('/login');
    });

    it('preserves the attempted URL in redirect', () => {
      window.history.pushState({}, '', '/dashboard');
      renderPrivateRoute(false);
      
      const searchParams = new URLSearchParams(window.location.search);
      expect(searchParams.get('from')).toBe('/dashboard');
    });
  });

  describe('PublicRoute', () => {
    const renderPublicRoute = (isAuthenticated: boolean) => {
      (useAuth as jest.Mock).mockReturnValue({ isAuthenticated });
      
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <PublicRoute>
                <PublicPage />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={<PrivatePage />} />
          </Routes>
        </BrowserRouter>
      );
    };

    it('renders children when not authenticated', () => {
      renderPublicRoute(false);
      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('redirects to dashboard when authenticated', () => {
      renderPublicRoute(true);
      expect(window.location.pathname).toBe('/dashboard');
    });

    it('redirects to custom route when specified', () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <PublicRoute redirectTo="/releases">
                <PublicPage />
              </PublicRoute>
            } />
          </Routes>
        </BrowserRouter>
      );

      expect(window.location.pathname).toBe('/releases');
    });

    it('handles redirect from query parameter', () => {
      window.history.pushState({}, '', '/login?from=/settings');
      renderPublicRoute(true);
      expect(window.location.pathname).toBe('/settings');
    });
  });

  describe('Route Integration', () => {
    it('handles nested private routes', () => {
      (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true });
      
      const NestedPrivate = () => <div>Nested Private Content</div>;
      
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <PrivateRoute>
                <div>
                  <Routes>
                    <Route path="nested" element={<NestedPrivate />} />
                  </Routes>
                </div>
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('preserves route parameters in redirects', () => {
      window.history.pushState({}, '', '/releases/123');
      (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
      
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/releases/:id" element={
              <PrivateRoute>
                <PrivatePage />
              </PrivateRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </BrowserRouter>
      );

      const searchParams = new URLSearchParams(window.location.search);
      expect(searchParams.get('from')).toBe('/releases/123');
    });
  });
});