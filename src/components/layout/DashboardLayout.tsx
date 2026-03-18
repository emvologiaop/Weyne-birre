import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Wallet, PieChart, Settings, LogOut, Tags,
  Scan, CreditCard, Trophy, Menu, X, Sparkles, TrendingUp, Upload,
  ArrowLeftRight, RefreshCw, FileBarChart2, Keyboard,
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { useAuth } from '../AuthProvider';
import { AIAdvisor } from '../AIAdvisor';
import { ReportBugButton } from '../ReportBugButton';
import { QuickAddWidget } from '../QuickAddWidget';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';
import { TransferModal } from '../modals/TransferModal';
import { RecurringTransactionModal } from '../modals/RecurringTransactionModal';
import { useAchievementTracker } from '../../lib/hooks/useAchievementTracker';
import { useRecurringChecker } from '../../lib/hooks/useRecurringChecker';
import { useSubscriptionChecker } from '../../lib/hooks/useSubscriptionChecker';
import { useKeyboardShortcuts } from '../../lib/hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Net Worth', href: '/net-worth', icon: TrendingUp },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Receipts', href: '/receipts', icon: Scan },
  { name: 'Reports', href: '/reports', icon: FileBarChart2 },
  { name: 'AI Advisor', href: '/ai-advisor', icon: Sparkles },
  { name: 'Bank Import', href: '/bank-import', icon: Upload },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  useAchievementTracker();
  useSubscriptionChecker();
  useRecurringChecker();
  useKeyboardShortcuts({ onNewTransfer: () => setTransferOpen(true) });

  const currentPage = navItems.find(item =>
    item.href === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.href)
  )?.name ?? 'Overview';

  return (
    <div className="flex h-screen bg-[#050505] dark:bg-[#050505] text-white font-sans selection:bg-brand/20 transition-colors duration-300">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-[#080808] border-r border-white/[0.04] flex flex-col lg:static lg:translate-x-0 shadow-xl"
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-lg">
              <img src="https://img.icons8.com/fluency/512/money-bag.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">ወይኔ ብሬ</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/30 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setTransferOpen(true); setIsSidebarOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-brand/10 border border-white/[0.05] hover:border-brand/20 text-white/50 hover:text-brand text-[11px] font-bold uppercase tracking-wider transition-all">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
            </button>
            <button onClick={() => { setRecurringOpen(true); setIsSidebarOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-brand/10 border border-white/[0.05] hover:border-brand/20 text-white/50 hover:text-brand text-[11px] font-bold uppercase tracking-wider transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Recurring
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map(item => {
            const isActive = item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);
            return (
              <Link key={item.name} to={item.href} onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 group relative',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-white/30 hover:text-white hover:bg-white/[0.03]'
                )}>
                {isActive && (
                  <motion.div layoutId="activeNav"
                    className="absolute left-0 w-0.5 h-5 bg-brand rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-brand' : 'text-white/20 group-hover:text-white/50')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-4 border-t border-white/[0.04]">
          <button onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-[12px] font-semibold text-white/20 hover:text-rose-400 hover:bg-rose-500/5 transition-all group">
            <LogOut className="w-4 h-4 text-white/10 group-hover:text-rose-400/60" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/30 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-display font-bold text-white tracking-tight">{currentPage}</h1>
              <p className="text-[10px] text-white/20 font-medium">
                {new Date().toLocaleDateString('en-ET', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-white/50">{user?.displayName || user?.email?.split('@')[0]}</span>
              <span className="text-[9px] text-white/20">{user?.email}</span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand/20 to-blue-600/20 border border-white/10 overflow-hidden">
              {user?.photoURL
                ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/30">{user?.email?.charAt(0).toUpperCase()}</div>
              }
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto">
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Floating elements */}
      <ReportBugButton />
      <QuickAddWidget />
      <KeyboardShortcutsHelp />
      <AIAdvisor />

      {/* Modals */}
      <TransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} />
      <RecurringTransactionModal isOpen={recurringOpen} onClose={() => setRecurringOpen(false)} />
    </div>
  );
}
