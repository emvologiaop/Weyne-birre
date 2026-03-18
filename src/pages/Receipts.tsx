import React, { useState } from 'react';
import { Plus, Receipt as ReceiptIcon, Search, Filter, Calendar, TrendingUp, Camera, FileText } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AddReceiptModal } from '../components/modals/AddReceiptModal';
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { motion } from 'framer-motion';

export default function Receipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'receipts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReceipts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const filteredReceipts = receipts.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.merchant?.toLowerCase().includes(q) ||
      String(r.amount || '').includes(q) ||
      (r.date || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-24 pb-32">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em]">Your Receipts</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase">
              Expense<br />
              <span className="text-emerald-400">Transactions</span>
            </h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-emerald-500 text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Camera className="w-4 h-4" />
              Upload Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Total Amount', value: filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', accent: 'bg-emerald-500' },
          { label: 'This Month', value: receipts.filter(r => { const d = new Date(r.date); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', accent: 'bg-blue-500', isCurrency: false },
          { label: 'Matching Receipts', value: filteredReceipts.length, icon: ReceiptIcon, color: 'text-brand', bg: 'bg-brand/10', accent: 'bg-brand', isCurrency: false },
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
                  {stat.isCurrency === false ? stat.value : (typeof stat.value === 'number' ? formatCurrencyShort(stat.value) : stat.value)}
                </h3>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-white/10 group-focus-within:text-emerald-400 transition-colors duration-500" />
        </div>
        <input
          type="text"
          placeholder="Search by shop name, amount, date or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-16 pr-8 py-6 bg-white/[0.01] border border-white/[0.03] rounded-[32px] text-base text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.03] transition-all duration-500 shadow-2xl"
        />
      </div>

      {filteredReceipts.length === 0 ? (
        <div className="text-center py-48 bg-white/[0.01] rounded-[64px] border border-white/[0.03] shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="w-28 h-28 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-10 shadow-2xl">
              <ReceiptIcon className="w-12 h-12 text-white/5" />
            </div>
            <h3 className="text-3xl font-display font-bold text-white mb-4">No Receipts Yet</h3>
            <p className="text-sm text-white/20 max-w-xs mx-auto leading-relaxed">Upload your first receipt to start keeping track.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredReceipts.map((receipt, i) => (
            <motion.div 
              key={receipt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-30 transition-all duration-1000" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-12">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/20 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-700 shadow-2xl">
                      <ReceiptIcon className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white text-3xl tracking-tight group-hover:text-emerald-400 transition-colors duration-500">{receipt.merchant}</h3>
                      <div className="flex items-center gap-3 mt-2.5">
                        <Calendar className="w-4 h-4 text-white/20" />
                        <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em]">{receipt.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Verified
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em]">Amount</p>
                      <p className="text-5xl font-display font-bold text-white tracking-tighter tabular-nums">
                        {formatCurrencyShort(receipt.amount)}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">Category</p>
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.4em]">{receipt.category || 'General'}</p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/[0.03] flex justify-between items-center">
                    <button className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em] hover:text-emerald-400 transition-colors duration-500">
                      View Original Image
                    </button>
                    <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] italic">ID: {receipt.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddReceiptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
