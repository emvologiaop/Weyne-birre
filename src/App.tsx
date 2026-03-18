import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Receipts from './pages/Receipts';
import Subscriptions from './pages/Subscriptions';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import AIAdvisorPage from './pages/AIAdvisorPage';
import NetWorth from './pages/NetWorth';
import Reports from './pages/Reports';
import BankImport from './pages/BankImport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './components/AuthProvider';
import {
  requestNotificationPermission,
  startReminderSchedule,
  stopReminderSchedule,
} from './lib/notificationService';
import { useUserProfile } from './lib/hooks/useFinanceData';
import { toast } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

/** Applies theme class to <html> based on user profile, including system preference */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme: string) => {
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        document.body.style.backgroundColor = '#f0f2f5';
        document.body.style.color = '#0f0f1a';
      } else if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = '#050505';
        document.body.style.color = '#ffffff';
      } else {
        // system — follow OS preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('light', !prefersDark);
        root.classList.toggle('dark', prefersDark);
        document.body.style.backgroundColor = prefersDark ? '#050505' : '#f0f2f5';
        document.body.style.color = prefersDark ? '#ffffff' : '#0f0f1a';
      }
    };

    const theme = profile?.theme ?? 'dark';
    applyTheme(theme);

    // Listen for OS preference changes when set to 'system'
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [profile?.theme]);

  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if (granted) startReminderSchedule();
    });

    const handleUpdate = () => {
      toast('Update available', {
        description: 'A new version of ወይኔ ብሬ is ready.',
        action: { label: 'Reload', onClick: () => window.location.reload() },
        duration: 12000,
      });
    };
    window.addEventListener('pwa-update-available', handleUpdate);

    return () => {
      stopReminderSchedule();
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
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
                  <Route path="net-worth" element={<NetWorth />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="bank-import" element={<BankImport />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
