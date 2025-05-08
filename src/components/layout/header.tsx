import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, MenuIcon, LogOutIcon, Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "@/components/layout/theme-context";
import { useAuth } from "@/hooks/use-auth";
import React, { useState } from "react";

interface HeaderProps {
  hasUpdates?: boolean;
}

export function Header({ hasUpdates }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('[data-user-menu]') === null) {
        setUserMenuOpen(false);
      }
      if ((e.target as HTMLElement).closest('[data-mobile-menu]') === null) {
        setMobileMenuOpen(false);
      }
    }
    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  return (
    <header role="banner" aria-label="Site header" className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to={user ? "/dashboard" : "/"} aria-label="logo" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="logo" className="h-6 w-6" />
            <span className="font-bold text-xl">Chromium Update Server</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6" aria-label="Main" role="navigation">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/releases" className="text-sm font-medium transition-colors hover:text-primary">
            Releases
          </Link>
          <Link to="/logs" className="text-sm font-medium transition-colors hover:text-primary">
            Logs
          </Link>
          <Link to="/settings" className="text-sm font-medium transition-colors hover:text-primary">
            Settings
          </Link>
          <Link to="/api-docs" className="text-sm font-medium transition-colors hover:text-primary">
            API Docs
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {hasUpdates && (
            <span data-testid="notification-badge" className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
          {user && (
            <>
              <span className="ml-2 font-medium">{user.name}</span>
              <div className="relative" data-user-menu>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="user menu"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="rounded-full w-8 h-8 object-cover"
                  />
                </Button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
                    tabIndex={-1}
                  >
                    <div className="flex items-center gap-2 p-4">
                      <img src={user.avatar} alt="avatar" className="rounded-full w-10 h-10 object-cover" />
                      <div>
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/settings" role="menuitem" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" tabIndex={0}>
                      <SettingsIcon className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100"
                      onClick={signOut}
                    >
                      <LogOutIcon className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {/* Mobile menu button */}
          <div className="md:hidden" data-mobile-menu>
            <Button
              variant="ghost"
              size="icon"
              aria-label="menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            {mobileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
                tabIndex={-1}
              >
                <Link to="/" role="menuitem" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                <Link to="/releases" role="menuitem" className="block px-4 py-2 hover:bg-gray-100">Releases</Link>
                <Link to="/logs" role="menuitem" className="block px-4 py-2 hover:bg-gray-100">Logs</Link>
                <Link to="/settings" role="menuitem" className="block px-4 py-2 hover:bg-gray-100">Settings</Link>
                <Link to="/api-docs" role="menuitem" className="block px-4 py-2 hover:bg-gray-100">API Docs</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}