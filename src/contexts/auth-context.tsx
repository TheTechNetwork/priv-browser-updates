import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  GitHubUser, 
  UserRole, 
  initializeAuth, 
  isAuthenticated as isGitHubAuthenticated,
  getUser,
  logout as gitHubLogout,
  getAuthorizationUrl,
  checkUserRole
} from "@/lib/github-auth";

// Define the auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  userRole: UserRole;
  checkAccess: (requiredRoles: UserRole[]) => boolean;
  login: () => void;
  logout: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  userRole: UserRole.GUEST,
  checkAccess: () => false,
  login: () => {},
  logout: () => {},
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
  const login = () => {
    window.location.href = getAuthorizationUrl();
  };

  // Function to logout
  const logout = () => {
    gitHubLogout();
    setUser(null);
    setUserRole(UserRole.GUEST);
  };

  // Initialize authentication on component mount
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      try {
        // Check if we're returning from GitHub OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (code) {
          // Handle the OAuth callback in a separate component
          // We'll implement this later
        } else {
          // Check if user is already authenticated
          if (isGitHubAuthenticated()) {
            const userData = getUser();
            if (userData) {
              setUser(userData);
              setUserRole(userData.role);
            } else {
              // Initialize auth and get user data
              const userData = await initializeAuth();
              if (userData) {
                setUser(userData);
                setUserRole(userData.role);
              }
            }
          }
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