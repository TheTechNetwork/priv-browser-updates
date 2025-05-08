"use client"

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export const ProtectedRoute = ({ Component }: { Component: () => JSX.Element }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
            </div>
        );
    }
    
    return isAuthenticated ? <Component /> : <Navigate to='/login' />;
};

// PrivateRoute: renders children if authenticated, otherwise redirects to /login (with ?from=...)
export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (isAuthenticated) {
        return <>{children}</>;
    }
    // Preserve attempted URL
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />;
};

// PublicRoute: renders children if not authenticated, otherwise redirects to /dashboard or a custom route
export const PublicRoute = ({ children, redirectTo }: { children: React.ReactNode, redirectTo?: string }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    // If authenticated, redirect to redirectTo, ?from param, or /dashboard
    if (isAuthenticated) {
        const params = new URLSearchParams(location.search);
        const from = params.get('from');
        return <Navigate to={redirectTo || from || '/dashboard'} replace />;
    }
    return <>{children}</>;
};