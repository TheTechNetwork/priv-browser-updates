// start the app always with '/' route
import { Toaster as Sonner } from "@/components/ui/sonner";

import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { TooltipProvider } from "./components/ui/tooltip";
import { RoleProtectedRoute } from "./components/auth/role-protected-route";
import { AuthProvider, UserRole } from "./contexts/auth-context";

import { ThemeProvider } from "./components/layout/theme-provider";
import "./index.css";
import Index from "./pages";
import LoginForm from "./pages/login";
import Logout from "./pages/logout";
import Releases from "./pages/releases";
import Settings from "./pages/settings";
import Logs from "./pages/logs";
import ApiDocs from "./pages/api-docs";
import AuthCallback from "./pages/auth-callback";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Index />} />
              <Route path='/releases' element={<Releases />} />
              <Route 
                path='/settings' 
                element={
                  <RoleProtectedRoute 
                    Component={Settings} 
                    requiredRoles={[UserRole.ADMIN]} 
                  />
                } 
              />
              <Route path='/logs' element={<Logs />} />
              <Route path='/api-docs' element={<ApiDocs />} />
              <Route path='/login' element={<LoginForm />} />
              <Route path='/logout' element={<Logout />} />
              <Route path='/auth/callback' element={<AuthCallback />} />
            </Routes>
          </BrowserRouter>
          <Sonner />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);