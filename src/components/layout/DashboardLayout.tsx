import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, PieChart, Settings, LogOut, Tags, Scan, CreditCard, Trophy, Menu, X, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../AuthProvider";
import { useState } from "react";
import { TelegramButton } from "../TelegramButton";
import { motion, AnimatePresence } from "motion/react";
import { useAchievementTracker } from "../../lib/hooks/useAchievementTracker";
import { useSubscriptionChecker } from "../../lib/hooks/useSubscriptionChecker";
import { AIAdvisor } from "../AIAdvisor";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Receipts", href: "/receipts", icon: Scan },
  { name: "AI Advisor", href: "/ai-advisor", icon: Sparkles },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Achievements", href: "/achievements", icon: Trophy },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Budgets", href: "/budgets", icon: PieChart },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize trackers
  useAchievementTracker();
  useSubscriptionChecker();

  return (
    <div className="flex h-screen bg-bg-dark text-white font-sans selection:bg-brand/20">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : "-100%" }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-[#080808] border-r border-white/[0.03] flex flex-col lg:static lg:transform-none shadow-[40px_0_80px_rgba(0,0,0,0.5)]"
      >
        <div className="h-28 flex items-center justify-between px-10">
          <div className="flex items-center gap-4 text-white font-display font-bold tracking-tighter text-2xl uppercase">
            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-brand/30 to-brand/5 border border-brand/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] group relative">
              <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="https://img.icons8.com/fluency/512/money-bag.png" alt="Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" />
            </div>
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">ወይኔ ብሬ</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/20 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-8 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-5 px-5 py-4 rounded-[20px] text-[12px] font-bold uppercase tracking-[0.2em] transition-all duration-700 group relative overflow-hidden",
                  isActive
                    ? "bg-white/[0.03] text-white shadow-inner ring-1 ring-white/10"
                    : "text-white/20 hover:text-white/90 hover:bg-white/[0.01]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-brand rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 transition-all duration-700", isActive ? "text-brand scale-110" : "text-white/10 group-hover:text-white/40 group-hover:scale-110")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/[0.03]">
          <button 
            onClick={signOut}
            className="flex items-center gap-5 px-5 py-4 w-full rounded-[20px] text-[11px] font-bold uppercase tracking-[0.3em] text-white/10 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-700 group"
          >
            <LogOut className="w-5 h-5 text-white/5 group-hover:text-rose-400/60 transition-colors duration-700" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand/5 to-transparent pointer-events-none opacity-30" />
        
        <header className="h-28 flex items-center justify-between px-8 lg:px-16 border-b border-white/[0.03] bg-[#050505]/60 backdrop-blur-3xl z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/20 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-bold text-white tracking-tighter uppercase">
              {navItems.find((item) => item.href === location.pathname)?.name || "Overview"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-1 h-1 rounded-full bg-brand/40" />
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[11px] font-bold text-brand uppercase tracking-[0.4em]">Premium</span>
              </div>
              <span className="text-[9px] text-white/10 uppercase font-bold tracking-[0.2em]">Verified Member</span>
            </div>
            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-brand/30 to-blue-600/30 border border-white/10 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-[1px] group cursor-pointer relative">
              <div className="w-full h-full rounded-[21px] overflow-hidden bg-[#050505] relative">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white/20">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 lg:p-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
        <TelegramButton />
        <AIAdvisor />
      </main>
    </div>
  );
}
