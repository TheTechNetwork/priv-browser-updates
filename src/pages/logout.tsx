import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Logout() {
  const { signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      signOut();
    }
  }, [isAuthenticated, signOut]);

  return <Navigate to="/login" />;
}
