import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GitHubUser, 
  UserRole, 
  initializeAuth, 
  isAuthenticated as isGitHubAuthenticated,
  getUser,
  logout as gitHubLogout,
  getAuthorizationUrl,
  checkUserRole,
  setApiBaseUrl
} from "@/lib/github-auth";

// Define the auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  userRole: UserRole;
  checkAccess: (requiredRoles: UserRole[]) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  userRole: UserRole.GUEST,
  checkAccess: () => false,
  login: async () => {},
  logout: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Re-export UserRole for convenience
export { UserRole };

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST);

  // Function to determine if user has access based on required roles
  const checkAccess = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(userRole);
  };

  // Function to initiate GitHub login
  const login = async () => {
    try {
      // Set API base URL
      setApiBaseUrl(window.location.origin);
      
      // Get authorization URL and redirect
      const authUrl = await getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating login:", error);
      throw error;
    }
  };

  // Function to logout
  const logout = async () => {
    try {
      await gitHubLogout();
      setUser(null);
      setUserRole(UserRole.GUEST);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  // Initialize authentication on component mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      try {
        // Set API base URL
        setApiBaseUrl(window.location.origin);
        
        // Check if we're on the callback page
        if (window.location.pathname === '/auth/callback') {
          // Skip initialization on callback page
          // The callback component will handle authentication
          setIsLoading(false);
          return;
        }
        
        // Initialize auth and get user data
        const userData = await initializeAuth();
        if (userData) {
          setUser(userData);
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        userRole,
        checkAccess,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};