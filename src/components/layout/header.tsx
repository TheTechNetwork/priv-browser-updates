import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, GithubIcon } from "lucide-react";
import { useTheme } from "@/components/layout/theme-context";

export function Header() {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <GithubIcon className="h-6 w-6" />
            <span className="font-bold text-xl">Chromium Update Server</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
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
        </div>
      </div>
    </header>
  );
}