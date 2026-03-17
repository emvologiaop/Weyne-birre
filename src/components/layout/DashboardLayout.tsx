import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, PieChart, Settings, LogOut, Tags, Scan, CreditCard, Trophy, Menu, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../AuthProvider";
import { useState } from "react";
import { TelegramButton } from "../TelegramButton";
import { motion, AnimatePresence } from "motion/react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Receipts", href: "/receipts", icon: Scan },
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

  return (
    <div className="flex h-screen bg-bg-dark text-white font-sans">
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
        className="fixed inset-y-0 left-0 z-50 w-72 bg-bg-sidebar border-r border-white/5 flex flex-col lg:static lg:transform-none shadow-2xl"
      >
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
          <div className="flex items-center gap-3 text-brand font-bold tracking-tight text-lg">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            ወይኔ ብሬ
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/5 text-white shadow-sm ring-1 ring-white/10"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-brand" : "text-white/40")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={signOut}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/5 bg-bg-dark/80 backdrop-blur-xl">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">
            {navItems.find((item) => item.href === location.pathname)?.name || "Overview"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand to-blue-600 border border-white/10 overflow-hidden shadow-lg">
              {user?.photoURL && (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
        <TelegramButton />
      </main>
    </div>
  );
}
