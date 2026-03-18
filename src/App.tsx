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
const LIGHT_MODE_CSS = `
  /* ── Dynamic light mode overrides injected after Tailwind ── */
  body { background-color: #f0f2f5 !important; color: #0f0f1a !important; }

  /* Page / sidebar / header backgrounds */
  .bg-page        { background-color: #f0f2f5 !important; }
  .bg-sidebar     { background-color: #ffffff !important; }
  .bg-header      { background-color: rgba(255,255,255,0.92) !important; }
  .bg-card        { background-color: #ffffff !important; }
  .bg-card-hover  { background-color: #f5f7fa !important; }
  .bg-input       { background-color: rgba(0,0,0,0.04) !important; }
  .bg-overlay     { background-color: rgba(0,0,0,0.04) !important; }
  .bg-overlay-md  { background-color: rgba(0,0,0,0.07) !important; }

  /* Semantic text classes */
  .text-primary   { color: #0f0f1a !important; }
  .text-secondary { color: rgba(15,15,26,0.68) !important; }
  .text-muted     { color: rgba(15,15,26,0.48) !important; }
  .text-faint     { color: rgba(15,15,26,0.28) !important; }

  /* Tailwind white/opacity text classes */
  .text-white                 { color: #0f0f1a !important; }
  [class*="text-white\/9"]   { color: #0f0f1a !important; }
  [class*="text-white\/8"]   { color: rgba(15,15,26,0.80) !important; }
  [class*="text-white\/7"]   { color: rgba(15,15,26,0.68) !important; }
  [class*="text-white\/6"]   { color: rgba(15,15,26,0.60) !important; }
  [class*="text-white\/5"]   { color: rgba(15,15,26,0.50) !important; }
  [class*="text-white\/4"]   { color: rgba(15,15,26,0.42) !important; }
  [class*="text-white\/3"]   { color: rgba(15,15,26,0.35) !important; }
  [class*="text-white\/2"]   { color: rgba(15,15,26,0.25) !important; }
  [class*="text-white\/1"]   { color: rgba(15,15,26,0.18) !important; }
  [class*="text-white\/[0"]  { color: rgba(15,15,26,0.15) !important; }

  /* Hardcoded hex backgrounds (cards, modals, pages) */
  [class*="bg-[#0"]  { background-color: #ffffff !important; }
  [class*="bg-[#1"]  { background-color: #f7f9fc !important; }

  /* Gradient cards */
  [class*="from-[#0"],
  [class*="from-[#1"] { --tw-gradient-from: #ffffff !important; }
  [class*="to-[#0"],
  [class*="to-[#1"]   { --tw-gradient-to:   #f0f3f7 !important; }

  /* Borders */
  .border-subtle               { border-color: rgba(0,0,0,0.07) !important; }
  .border-normal               { border-color: rgba(0,0,0,0.12) !important; }
  [class*="border-white\/"]   { border-color: rgba(0,0,0,0.08) !important; }
  [class*="border-white\/1"]  { border-color: rgba(0,0,0,0.13) !important; }

  /* Overlays / card-glass backgrounds */
  [class*="bg-white\/[0"]  { background-color: rgba(0,0,0,0.04) !important; }
  [class*="bg-white\/5"]   { background-color: rgba(0,0,0,0.06) !important; }
  [class*="bg-black\/"]    { background-color: rgba(0,0,0,0.04) !important; }

  /* Sidebar and header elements */
  aside  { background-color: #ffffff !important; border-right-color:  rgba(0,0,0,0.07) !important; }
  header { background-color: rgba(255,255,255,0.92) !important; border-bottom-color: rgba(0,0,0,0.07) !important; }

  /* Inputs / selects / textareas */
  input, select, textarea {
    background-color: rgba(0,0,0,0.04) !important;
    color: #0f0f1a !important;
    border-color: rgba(0,0,0,0.12) !important;
  }
  input::placeholder, textarea::placeholder { color: rgba(15,15,26,0.35) !important; }

  /* Shadows */
  [class*="shadow-"] { box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05) !important; }

  /* Backdrop blur panels */
  [class*="backdrop-blur"] {
    background-color: rgba(255,255,255,0.85) !important;
    backdrop-filter: blur(12px);
  }
`;

function injectLightStyle() {
  let el = document.getElementById('weyne-light-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'weyne-light-theme';
    document.head.appendChild(el);
  }
  el.textContent = LIGHT_MODE_CSS;
}

function removeLightStyle() {
  document.getElementById('weyne-light-theme')?.remove();
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (theme: string) => {
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

      root.setAttribute('data-theme', resolved);
      root.classList.toggle('light', resolved === 'light');
      root.classList.toggle('dark',  resolved === 'dark');

      if (resolved === 'light') {
        injectLightStyle();
        document.body.style.backgroundColor = '#f0f2f5';
        document.body.style.color = '#0f0f1a';
      } else {
        removeLightStyle();
        document.body.style.backgroundColor = '#050505';
        document.body.style.color = '#f2f2f2';
      }
    };

    const theme = profile?.theme ?? 'dark';
    applyTheme(theme);

    // Listen for immediate theme changes from Settings page
    const handleApplyTheme = (e: Event) => {
      applyTheme((e as CustomEvent).detail);
    };
    window.addEventListener('apply-theme', handleApplyTheme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mq.addEventListener('change', listener);
      return () => {
        window.removeEventListener('apply-theme', handleApplyTheme);
        mq.removeEventListener('change', listener);
      };
    }
    return () => window.removeEventListener('apply-theme', handleApplyTheme);
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
