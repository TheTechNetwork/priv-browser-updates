import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored auth state
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should start with no user authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle successful sign in', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    (apiClient.signIn as jest.Mock).mockResolvedValueOnce({ user: mockUser, token: 'test-token' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'password' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('auth-token')).toBe('test-token');
  });

  it('should handle sign in failure', async () => {
    (apiClient.signIn as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn({ email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        expect(error.message).toBe('Invalid credentials');
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('should handle sign out', async () => {
    // First sign in
    const mockUser = { id: 1, email: 'test@example.com' };
    (apiClient.signIn as jest.Mock).mockResolvedValueOnce({ user: mockUser, token: 'test-token' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'password' });
    });

    // Then sign out
    (apiClient.signOut as jest.Mock).mockResolvedValueOnce({});

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('should persist auth state across reloads', () => {
    // Simulate stored auth state
    localStorage.setItem('auth-token', 'test-token');
    sessionStorage.setItem('auth-user', JSON.stringify({ id: 1, email: 'test@example.com' }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: 1, email: 'test@example.com' });
  });

  it('should handle invalid stored auth state', () => {
    // Simulate corrupted auth state
    localStorage.setItem('auth-token', 'test-token');
    sessionStorage.setItem('auth-user', 'invalid-json');

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});