import { Octokit } from "@octokit/rest";

// API base URL - will be set dynamically based on environment
let API_BASE_URL = '';

// Storage keys
const TOKEN_STORAGE_KEY = "github_auth_token";
const USER_STORAGE_KEY = "github_user";

// Set the API base URL based on the current environment
export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

// User roles
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

// User interface
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  role: UserRole;
}

interface AuthConfig {
  clientId: string;
  redirectUri: string;
}

/**
 * Get GitHub OAuth configuration
 */
export async function getAuthConfig(): Promise<AuthConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch auth config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get auth config:", error);
    throw new Error("Failed to get authentication configuration");
  }
}

/**
 * Get the GitHub authorization URL
 */
export async function getAuthorizationUrl(): Promise<string> {
  const config = await getAuthConfig();
  const state = generateRandomState();
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "read:user user:email",
    state,
  });
  
  // Store state for verification
  sessionStorage.setItem("github_auth_state", state);
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Generate a random state for OAuth security
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Exchange the authorization code for an access token and user info
 */
export async function authenticateWithGitHub(code: string): Promise<{
  token: string;
  user: GitHubUser;
  isAdmin: boolean;
  expiresAt: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    const authData = await response.json();
    
    // Create user object with role
    const user: GitHubUser = {
      ...authData.user,
      role: authData.isAdmin ? UserRole.ADMIN : UserRole.USER,
    };
    
    // Save auth data
    saveAuthToken(authData.token);
    saveUser(user);
    
    return {
      token: authData.token,
      user,
      isAdmin: authData.isAdmin,
      expiresAt: authData.expiresAt,
    };
  } catch (error) {
    console.error("Failed to authenticate with GitHub:", error);
    throw new Error("Authentication failed");
  }
}

/**
 * Verify a session token
 */
export async function verifySession(): Promise<{
  authenticated: boolean;
  user?: GitHubUser;
  isAdmin?: boolean;
}> {
  const token = getAuthToken();
  if (!token) {
    return { authenticated: false };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (data.authenticated && data.user) {
      // Update stored user with latest data
      const user: GitHubUser = {
        ...data.user,
        role: data.isAdmin ? UserRole.ADMIN : UserRole.USER,
      };
      
      saveUser(user);
      
      return {
        authenticated: true,
        user,
        isAdmin: data.isAdmin,
      };
    }
    
    // If not authenticated, clear local storage
    removeAuthToken();
    return { authenticated: false };
  } catch (error) {
    console.error("Failed to verify session:", error);
    return { authenticated: false };
  }
}

/**
 * Save the authentication token to local storage
 */
export function saveAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * Get the authentication token from local storage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Remove the authentication token from local storage
 */
export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Save the user to local storage
 */
export function saveUser(user: GitHubUser): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Get the user from local storage
 */
export function getUser(): GitHubUser | null {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getUser();
}

/**
 * Check if the user has the required role
 */
export function checkUserRole(requiredRoles: UserRole[]): boolean {
  const user = getUser();
  return user ? requiredRoles.includes(user.role) : false;
}

/**
 * Logout the user
 */
export async function logout(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
  
  removeAuthToken();
}

/**
 * Initialize GitHub authentication
 * Check if the user is already authenticated and verify session
 */
export async function initializeAuth(): Promise<GitHubUser | null> {
  try {
    // Set API base URL based on current location
    setApiBaseUrl(window.location.origin);
    
    // Verify session with backend
    const { authenticated, user } = await verifySession();
    
    if (authenticated && user) {
      return user;
    }
    
    return null;
  } catch (error) {
    console.error("Error initializing auth:", error);
    removeAuthToken();
    return null;
  }
}