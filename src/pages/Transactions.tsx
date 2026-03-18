import React, { useState } from "react";
import { Plus, Search, Filter, Loader2, Receipt, Trash2, Calendar, Tag, Wallet as WalletIcon, ChevronDown, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { useTransactions, useCategories, useAccounts } from "../lib/hooks/useFinanceData";
import { AddTransactionModal } from "../components/modals/AddTransactionModal";
import { doc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { motion, AnimatePresence } from "framer-motion";

export default function Transactions() {
  const { transactions, loading } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    account: "all",
    startDate: "",
    endDate: ""
  });

  const handleDelete = async (id: string, tx: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'transactions', id));
      // Reverse the balance effect on the account
      await updateDoc(doc(db, 'accounts', tx.accountId), {
        balance: increment(-tx.amount)
      });
      toast.success('Transaction deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = (tx.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filters.category === "all" || tx.categoryId === filters.category;
      const matchesAccount = filters.account === "all" || tx.accountId === filters.account;
      const txDate = new Date(tx.date);
      const matchesDate =
        (!filters.startDate || txDate >= new Date(filters.startDate)) &&
        (!filters.endDate || txDate <= new Date(filters.endDate));
      return matchesSearch && matchesCategory && matchesAccount && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "Uncategorized";
  };

  const getAccountName = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? acc.name : "Unknown Account";
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-[10px] font-bold text-white/72 uppercase tracking-[0.5em]">Your Transactions</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase">
              The<br />
              <span className="text-brand">Transactions</span>
            </h1>
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-xl">
                <p className="text-[10px] font-bold text-white/55 uppercase tracking-[0.2em] mb-1">Total Count</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display font-bold text-white">{transactions.length}</span>
                  <span className="text-[10px] text-white/65 font-bold uppercase tracking-widest">Transactions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/55 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/[0.02] border border-white/[0.05] rounded-[24px] text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-brand/30 focus:bg-white/[0.04] transition-all shadow-2xl"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center gap-3 px-6 py-4 rounded-[24px] border transition-all font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl",
              showFilters 
                ? "bg-brand/10 text-brand border-brand/20" 
                : "bg-white/[0.02] text-white/72 border-white/[0.05] hover:border-white/10 hover:text-white"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 px-10 py-4 rounded-[24px] bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: "Money In", 
            value: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0), 
            icon: TrendingUp, 
            color: "text-brand", 
            bg: "bg-brand/10",
            accent: "bg-brand"
          },
          { 
            label: "Money Out", 
            value: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0), 
            icon: TrendingDown, 
            color: "text-rose-400", 
            bg: "bg-rose-400/10",
            accent: "bg-rose-500"
          },
          { 
            label: "Balance Change", 
            value: filteredTransactions.reduce((sum, t) => sum + (t.type === 'income' ? Math.abs(t.amount) : -Math.abs(t.amount)), 0), 
            icon: WalletIcon, 
            color: "text-blue-400", 
            bg: "bg-blue-400/10",
            accent: "bg-blue-500"
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[40px] bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group hover:bg-white/[0.03] transition-all duration-700"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700", stat.accent)} />
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.4em]">{stat.label}</p>
                <h3 className="text-4xl font-display font-bold text-white tracking-tight tabular-nums">
                  {formatCurrencyShort(Math.abs(stat.value))}
                </h3>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.03] shadow-2xl backdrop-blur-xl">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em] ml-1">Category</label>
                <div className="relative">
                  <select 
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] text-sm text-white focus:outline-none focus:border-brand/30 appearance-none cursor-pointer hover:bg-white/[0.04] transition-all"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/55 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em] ml-1">Account</label>
                <div className="relative">
                  <select 
                    value={filters.account}
                    onChange={(e) => setFilters(f => ({ ...f, account: e.target.value }))}
                    className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] text-sm text-white focus:outline-none focus:border-brand/30 appearance-none cursor-pointer hover:bg-white/[0.04] transition-all"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/55 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em] ml-1">From Date</label>
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] text-sm text-white focus:outline-none focus:border-brand/30 cursor-pointer hover:bg-white/[0.04] transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em] ml-1">To Date</label>
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] text-sm text-white focus:outline-none focus:border-brand/30 cursor-pointer hover:bg-white/[0.04] transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <div className="space-y-6">
        <div className="hidden md:grid grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_80px] gap-8 px-12 py-4 text-[11px] font-bold text-white/45 uppercase tracking-[0.4em]">
          <div>Date</div>
          <div>Description</div>
          <div>Category</div>
          <div>Account</div>
          <div className="text-right">Amount</div>
          <div></div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="py-32 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-48 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-8 shadow-2xl">
                  <Receipt className="w-10 h-10 text-white/35" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">No Transactions Yet</h3>
                <p className="text-sm text-white/55 max-w-xs leading-relaxed">Try a different search or add a new transaction.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group p-8 md:px-12 md:py-10 rounded-[48px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-700 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand/0 via-brand/[0.01] to-brand/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.2fr_1.2fr_1fr_80px] gap-8 items-center relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/45 group-hover:text-brand group-hover:bg-brand/10 transition-all duration-700">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-white">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-[10px] text-white/55 font-bold uppercase tracking-widest">{new Date(tx.date).getFullYear()}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-lg font-bold text-white group-hover:text-brand transition-colors duration-500">{tx.description || tx.name || "Unnamed"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/55 font-bold uppercase tracking-[0.2em]">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        ID: {tx.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[11px] font-bold text-white/65 uppercase tracking-widest group-hover:text-white group-hover:border-white/10 transition-all duration-500">
                        <Tag className="w-3.5 h-3.5" />
                        {getCategoryName(tx.categoryId)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                          <WalletIcon className="w-4.5 h-4.5 text-white/45" />
                        </div>
                        <span className="text-xs font-bold text-white/65 group-hover:text-white/78 transition-colors">{getAccountName(tx.accountId)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-display font-bold tracking-tight tabular-nums",
                        tx.type === 'income' ? "text-brand" : "text-white/80 group-hover:text-white"
                      )}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrencyShort(Math.abs(tx.amount))}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={(e) => handleDelete(tx.id, tx, e)}
                        className="p-4 rounded-2xl bg-rose-500/0 text-rose-500/0 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-500 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
