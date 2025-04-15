import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface RoleProtectedRouteProps {
  Component: React.ComponentType;
  requiredRoles: UserRole[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  Component,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, checkAccess } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has required role
  if (!checkAccess(requiredRoles)) {
    return <Navigate to="/" />;
  }

  // Render the protected component
  return <Component />;
};