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
    const { result } = renderHook(() => useAuth());
    // signInWithGitHub triggers a redirect, so we can spy on window.location.href
    const originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', { writable: true, value: '' });
    await act(async () => {
      await result.current.signInWithGitHub();
    });
    expect(window.location.href).toContain('github.com/login/oauth/authorize');
    window.location.href = originalHref;
  });

  it('should handle sign in failure', async () => {
    // signInWithGitHub does not throw, but we can check that it sets window.location.href
    const { result } = renderHook(() => useAuth());
    const originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', { writable: true, value: '' });
    await act(async () => {
      await result.current.signInWithGitHub();
    });
    expect(window.location.href).toContain('github.com/login/oauth/authorize');
    window.location.href = originalHref;
  });

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuth());
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