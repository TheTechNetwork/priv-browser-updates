"use client"

import { Navigate } from "react-router-dom";
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