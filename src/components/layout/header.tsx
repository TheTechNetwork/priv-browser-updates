import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Camera className="h-6 w-6" />
          <span className="font-bold text-xl">PhotoFolio</span>
        </Link>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
            end
          >
            Gallery
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Contact
          </NavLink>
          <ThemeToggle />
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b p-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
                onClick={() => setIsMenuOpen(false)}
                end
              >
                Gallery
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </NavLink>
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}