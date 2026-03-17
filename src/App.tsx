/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Accounts from "./pages/Accounts";
import Budgets from "./pages/Budgets";
import Receipts from "./pages/Receipts";
import Subscriptions from "./pages/Subscriptions";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import AIAdvisorPage from "./pages/AIAdvisorPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./components/AuthProvider";
import { requestNotificationPermission, showNotification } from "./lib/notificationService";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Request permission on load
    requestNotificationPermission();

    // 6-hour interval: 6 * 60 * 60 * 1000 = 21,600,000 ms
    const interval = setInterval(() => {
      showNotification("ወይኔ ብሬ Reminder", "It's time to check your finances!");
    }, 21600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="receipts" element={<Receipts />} />
                <Route path="ai-advisor" element={<AIAdvisorPage />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="categories" element={<Categories />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
