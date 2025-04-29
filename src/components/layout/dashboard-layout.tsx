import React from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { AppSidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <div className="hidden md:block w-64 flex-shrink-0">
          <AppSidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 