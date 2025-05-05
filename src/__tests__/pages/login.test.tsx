import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/login';
import { useAuth } from '@/hooks/use-auth';

// Mock the auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Page', () => {
  const mockSignIn = jest.fn();
  
  const setup = (isAuthenticated = false) => {
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated,
    });

    const user = userEvent.setup();
    const utils = render(
      <BrowserRouter>
        <Login />
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

  it('renders login form', () => {
    setup();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const { user } = setup();
    mockSignIn.mockResolvedValueOnce({});

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays validation errors for empty fields', async () => {
    const { user } = setup();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('displays validation error for invalid email', async () => {
    const { user } = setup();

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('handles login failure', async () => {
    const { user } = setup();
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('redirects to home if already authenticated', () => {
    setup(true);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('disables submit button while loading', async () => {
    const { user } = setup();
    // Make sign in take some time
    mockSignIn.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const { user } = setup();

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password/i });

    // Password should be hidden by default
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});