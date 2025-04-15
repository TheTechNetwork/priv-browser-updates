import { Octokit } from "@octokit/rest";
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

// GitHub OAuth App credentials
// In a production environment, these would be environment variables
const GITHUB_CLIENT_ID = "your-github-client-id";
const GITHUB_CLIENT_SECRET = "your-github-client-secret";
const GITHUB_REDIRECT_URI = "http://localhost:12000/auth/callback";
const GITHUB_SCOPES = ["read:user", "user:email"];

// Storage keys
const TOKEN_STORAGE_KEY = "github_auth_token";
const USER_STORAGE_KEY = "github_user";

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

/**
 * Get the GitHub authorization URL
 */
export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: GITHUB_SCOPES.join(" "),
    state: generateRandomState(),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Generate a random state for OAuth security
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Exchange the authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || "Failed to exchange code for token");
    }

    return data.access_token;
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    throw error;
  }
}

/**
 * Get the authenticated user's information
 */
export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  try {
    const octokit = new Octokit({
      auth: token,
    });

    const { data: user } = await octokit.users.getAuthenticated();
    
    // Get user's email if not public
    let email = user.email;
    if (!email) {
      const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail?.email || null;
    }

    // In a real application, you would check if the user is an admin
    // For now, we'll consider all authenticated users as admins
    const role = UserRole.ADMIN;

    return {
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      email,
      role,
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    throw error;
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
export function logout(): void {
  removeAuthToken();
}

/**
 * Initialize GitHub authentication
 * Check if the user is already authenticated and fetch user data if needed
 */
export async function initializeAuth(): Promise<GitHubUser | null> {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }
  
  try {
    // If we have a user in storage, return it
    const storedUser = getUser();
    if (storedUser) {
      return storedUser;
    }
    
    // Otherwise, fetch the user data
    const user = await getAuthenticatedUser(token);
    saveUser(user);
    return user;
  } catch (error) {
    console.error("Error initializing auth:", error);
    removeAuthToken();
    return null;
  }
}