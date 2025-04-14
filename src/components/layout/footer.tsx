import { GithubIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col sm:flex-row items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <GithubIcon className="h-5 w-5" />
          <p className="text-sm text-muted-foreground">
            Chromium Update Server © {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            GitHub
          </a>
          <a 
            href="https://developers.cloudflare.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cloudflare
          </a>
          <a 
            href="https://www.chromium.org/developers/design-documents/software-updates-courgette/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Chromium Updates
          </a>
        </div>
      </div>
    </footer>
  );
}