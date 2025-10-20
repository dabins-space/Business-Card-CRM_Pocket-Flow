import React, { useState } from "react";
import { Camera, Sparkles, Users, BarChart3, Settings } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function AppShell({ children, title, currentPage = "/", onNavigate }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "홈", href: "/", icon: Camera, label: "명함 등록" },
    { name: "AI 인사이트", href: "/ai-insights", icon: Sparkles, label: "AI 분석" },
    { name: "고객 목록", href: "/customers", icon: Users, label: "고객 관리" },
    { name: "리포트", href: "/reports", icon: BarChart3, label: "통계" },
    { name: "설정", href: "/settings", icon: Settings, label: "관리" },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onNavigate?.(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header - title only */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-center px-4 h-14">
          <h1 className="text-foreground">
            {title || "Pocket Flow"}
          </h1>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r border-border overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 h-16 border-b border-border">
            <h1 className="text-foreground text-base">Pocket Flow</h1>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-[11px] opacity-70">{item.label}</span>
                  </div>
                </a>
              );
            })}
          </nav>
        </div>
      </aside>



      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] text-center leading-tight">{item.name}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
