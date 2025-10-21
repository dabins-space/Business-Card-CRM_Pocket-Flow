import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "./components/AppShell";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import AuthPage from "./pages/auth";
import { LoadingState } from "./components/LoadingState";

const Toaster = dynamic(() => import("./components/ui/sonner").then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});

// Import new pages
import HomePage from "./pages/home";
import UploadPage from "./pages/upload";
import AIInsightsPage from "./pages/ai-insights";
import AIHistoryPage from "./pages/ai-history";
import CustomersPage from "./pages/customers";
import CustomerDetailPage from "./pages/customer-detail";
import ReportsPage from "./pages/reports";
import SettingsPage from "./pages/settings";
import AdminWhitelistPage from "./pages/admin-whitelist";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("/");
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  const handleNavigation = (page: string) => {
    // URL 파라미터 파싱
    const [path, queryString] = page.split('?');
    const params: Record<string, string> = {};
    
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    setCurrentPage(path);
    setPageParams(params);
  };

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return <LoadingState />;
  }

  // 로그인되지 않은 경우 로그인 페이지 표시
  if (!user) {
    return <AuthPage onNavigate={handleNavigation} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "/":
        return <HomePage onNavigate={handleNavigation} />;
      case "/upload":
        return <UploadPage onNavigate={handleNavigation} />;
      case "/ai-insights":
        return <AIInsightsPage 
          onNavigate={handleNavigation} 
          companyName={pageParams.company}
          analysisData={pageParams.analysisData}
          fromHistory={pageParams.fromHistory}
          fromCustomer={pageParams.fromCustomer}
        />;
      case "/ai-history":
        return <AIHistoryPage onNavigate={handleNavigation} />;
      case "/customers":
        return <CustomersPage onNavigate={handleNavigation} />;
      case "/customer-detail":
        return <CustomerDetailPage onNavigate={handleNavigation} contactId={pageParams.id} />;
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
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground dark">
        <AppContent />
        <Toaster />
      </div>
    </AuthProvider>
  );
}