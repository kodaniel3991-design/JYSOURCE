"use client";

import { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

interface SidebarLayoutProps {
  children: React.ReactNode;
  username?: string;
  factory?: string;
  isAdmin?: boolean;
}

export function SidebarLayout({ children, username, factory, isAdmin }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        isAdmin={isAdmin}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onNavigate={() => setCollapsed(true)}
      />
      <div
        className="transition-[padding-left] duration-300"
        style={{ paddingLeft: collapsed ? 64 : 256 }}
      >
        <AppHeader username={username} factory={factory} isAdmin={isAdmin} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
