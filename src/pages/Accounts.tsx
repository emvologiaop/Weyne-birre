import { useState } from "react";
import { Wallet, Plus, Loader2, Trash2, Building2, CreditCard, Landmark, Coins } from "lucide-react";
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { useAccounts } from "../lib/hooks/useFinanceData";
import { AddAccountModal } from "../components/modals/AddAccountModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { motion } from "framer-motion";

const getAccountIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'checking': return Landmark;
    case 'savings': return Building2;
    case 'credit': return CreditCard;
    case 'investment': return Coins;
    default: return Wallet;
  }
};

export default function Accounts() {
  const { accounts, loading } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'accounts', id));
      toast.success('Account deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'accounts');
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="space-y-24 pb-32">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em]">Your Accounts</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase">
              Financial<br />
              <span className="text-brand">Accounts</span>
            </h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Total Balance', value: accounts.reduce((sum, acc) => sum + acc.balance, 0), icon: Landmark, color: 'text-brand', bg: 'bg-brand/10', accent: 'bg-brand' },
          {
            // Available Money = cash/checking/savings/bank with positive balance only
            label: 'Available Money',
            value: accounts
              .filter(a => ['cash', 'checking', 'savings', 'bank'].includes(a.type) && a.balance > 0)
              .reduce((sum, acc) => sum + acc.balance, 0),
            icon: Coins, color: 'text-blue-400', bg: 'bg-blue-400/10', accent: 'bg-blue-500'
          },
          {
            // Money Owed = debt accounts (balance = amount owed) + any negative-balance accounts
            label: 'Money Owed',
            value: accounts.reduce((sum, acc) => {
              if (acc.type === 'debt') return sum + Math.max(0, acc.balance); // debt: positive balance = owed
              if (acc.balance < 0) return sum + Math.abs(acc.balance); // overdraft / credit card in debt
              return sum;
            }, 0),
            icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-400/10', accent: 'bg-rose-500'
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group hover:bg-white/[0.03] transition-all duration-700"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700", stat.accent)} />
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em]">{stat.label}</p>
                <h3 className="text-4xl font-display font-bold text-white tracking-tight tabular-nums">
                  {formatCurrencyShort(stat.value)}
                </h3>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-12 h-12 text-brand animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-48 bg-white/[0.01] rounded-[64px] border border-white/[0.03] shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="w-28 h-28 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-10 shadow-2xl">
              <Wallet className="w-12 h-12 text-white/5" />
            </div>
            <h3 className="text-3xl font-display font-bold text-white mb-4">No Accounts Yet</h3>
            <p className="text-sm text-white/20 max-w-xs mx-auto leading-relaxed">Add your first account to start tracking your money.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {accounts.map((account, i) => {
            const Icon = getAccountIcon(account.type);
            return (
              <motion.div 
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-30 transition-all duration-1000" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-12">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/20 group-hover:text-brand group-hover:bg-brand/10 group-hover:border-brand/20 transition-all duration-700 shadow-2xl">
                        <Icon className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white text-3xl tracking-tight group-hover:text-brand transition-colors duration-500">{account.name}</h3>
                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2">{account.institution || account.type}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(account.id);
                      }}
                      className="p-4 text-white/5 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 duration-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em]">Current Balance</p>
                        <p className={cn(
                          "text-5xl font-display font-bold tracking-tighter tabular-nums",
                          account.balance < 0 ? 'text-rose-400' : 'text-white'
                        )}>
                          {formatCurrencyShort(account.balance)}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">Account ID</p>
                        <p className="text-[11px] font-mono text-white/30 tracking-widest">•••• {account.id.slice(-4).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/[0.03] flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em]">Active</span>
                      </div>
                      <span className="text-[11px] font-bold text-white/10 uppercase tracking-[0.4em] italic">Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
