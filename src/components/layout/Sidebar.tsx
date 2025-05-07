//use this component to create a sidebar for your application
// place it in main.tsx file
//adjust the items based on route paths
import { Home, List, FileText, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar-components";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    testId: "dashboard-icon",
  },
  {
    title: "Releases",
    url: "/releases",
    icon: List,
    testId: "releases-icon",
  },
  {
    title: "Logs",
    url: "/logs",
    icon: FileText,
    testId: "logs-icon",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    testId: "settings-icon",
  },
];

interface AppSidebarProps {
  isAuthenticated?: boolean;
}

export function AppSidebar({ isAuthenticated = true }: AppSidebarProps) {
  // Simulate user info for sidebar (in real app, get from auth context)
  const user = {
    name: "Test User",
    email: "test@example.com",
    avatar: null,
  };
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <SidebarProvider defaultOpen={!collapsed}>
      <Sidebar variant="sidebar" side="left" className="h-full fixed" data-collapsed={collapsed}>
        <SidebarContent>
          <button
            aria-label="Toggle Sidebar"
            onClick={() => setCollapsed((c) => !c)}
            style={{ margin: 8 }}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          {isAuthenticated && (
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.url}
                            data-testid={item.testId}
                            className={isActive ? "active" : ""}
                            data-active={isActive}
                            title={collapsed ? item.title : undefined}
                          >
                            <item.icon />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          {/* User profile section */}
          <SidebarGroup>
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex items-center gap-2 p-2">
                <User className="w-6 h-6" />
                <div>
                  <div>{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
