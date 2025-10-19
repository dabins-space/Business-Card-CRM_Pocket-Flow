"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "./components/AppShell";

const Toaster = dynamic(() => import("./components/ui/sonner").then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});

// Import new pages
import HomePage from "./pages/home";
import UploadPage from "./pages/upload";
import AIInsightsPage from "./pages/ai-insights";
import CustomersPage from "./pages/customers";
import CustomerDetailPage from "./pages/customer-detail";
import ReportsPage from "./pages/reports";
import SettingsPage from "./pages/settings";
import AdminWhitelistPage from "./pages/admin-whitelist";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("/");

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <HomePage onNavigate={handleNavigation} />;
      case "/upload":
        return <UploadPage onNavigate={handleNavigation} />;
      case "/ai-insights":
        return <AIInsightsPage onNavigate={handleNavigation} />;
      case "/customers":
        return <CustomersPage onNavigate={handleNavigation} />;
      case "/customer-detail":
        return <CustomerDetailPage onNavigate={handleNavigation} />;
      case "/reports":
        return <ReportsPage onNavigate={handleNavigation} />;
      case "/settings":
        return <SettingsPage onNavigate={handleNavigation} />;
      case "/admin-whitelist":
        return <AdminWhitelistPage onNavigate={handleNavigation} />;
      default:
        return <HomePage onNavigate={handleNavigation} />;
    }
  };

  return (
    <AppShell currentPage={currentPage} onNavigate={handleNavigation}>
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <AppContent />
      <Toaster />
    </div>
  );
}
