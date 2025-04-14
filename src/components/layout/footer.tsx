import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link to="/" className="text-lg font-bold">Luminous</Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Capturing moments, preserving memories
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Connect with me</p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" asChild aria-label="Instagram">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Twitter">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Facebook">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Email">
                <a href="mailto:contact@luminous.com">
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Luminous Photography. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/contact" className="text-xs text-muted-foreground hover:text-foreground">
              Contact
            </Link>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}