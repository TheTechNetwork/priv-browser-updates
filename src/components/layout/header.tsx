import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <span className="text-xl font-bold tracking-tight">Luminous</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary transition-colors"
              }
              end
            >
              Gallery
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary transition-colors"
              }
            >
              About
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary transition-colors"
              }
            >
              Contact
            </NavLink>
          </nav>
          <ThemeToggle />
        </div>
        
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-b bg-background z-50">
          <nav className="container flex flex-col py-4 px-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `py-3 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`
              }
              onClick={closeMenu}
              end
            >
              Gallery
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `py-3 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`
              }
              onClick={closeMenu}
            >
              About
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `py-3 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`
              }
              onClick={closeMenu}
            >
              Contact
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}