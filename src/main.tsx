// start the app always with '/' route
import { Toaster as Sonner } from "@/components/ui/sonner";

import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { 
  Route, 
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider 
} from "react-router-dom";

import { TooltipProvider } from "./components/ui/tooltip";

import { ThemeProvider } from "./components/layout/theme-provider";
import "./index.css";
import Index from "./pages";
import LoginForm from "./pages/login";
import Logout from "./pages/logout";
import Releases from "./pages/releases";
import Settings from "./pages/settings";
import Logs from "./pages/logs";
import ApiDocs from "./pages/api-docs";
import AuthCallback from "./pages/auth/callback";
import { initializeAuth } from "./lib/auth";

// Initialize auth on app start
initializeAuth();

const queryClient = new QueryClient();

// Create router with future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path='/' element={<Index />} />
      <Route path='/releases' element={<Releases />} />
      <Route path='/settings' element={<Settings />} />
      <Route path='/logs' element={<Logs />} />
      <Route path='/api-docs' element={<ApiDocs />} />
      <Route path='/login' element={<LoginForm />} />
      <Route path='/logout' element={<Logout />} />
      <Route path='/auth/callback' element={<AuthCallback />} />
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

// Simple loading component for hydration state
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <RouterProvider 
          router={router}
          fallbackElement={<LoadingFallback />}
        />
        <Sonner />
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);