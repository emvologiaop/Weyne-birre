import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDebts } from '../lib/hooks/useFinanceData';
import { formatCurrencyShort } from '../lib/utils';
import { AddDebtModal } from '../components/modals/AddDebtModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function DebtManager() {
  const { debts, loading } = useDebts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'borrowed' | 'lent'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paid'>('active');

  const filteredDebts = debts.filter(d => 
    (filter === 'all' || d.type === filter) && 
    (d.status === statusFilter)
  );

  const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status === 'active').reduce((sum, d) => sum + d.remaining, 0);
  const totalLent = debts.filter(d => d.type === 'lent' && d.status === 'active').reduce((sum, d) => sum + d.remaining, 0);

  const handleMarkPaid = async (debtId: string) => {
    try {
      await updateDoc(doc(db, 'debts', debtId), {
        status: 'paid',
        remaining: 0
      });
      toast.success('Marked as paid!');
    } catch (e: any) {
      toast.error('Failed to update: ' + e.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-white/50">Loading debts...</div>;
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-8">
        <div>
          <p className="text-[11px] font-bold text-white/65 uppercase tracking-[0.5em] mb-3">Debt & IOUs</p>
          <h1 className="text-5xl font-display font-bold text-white tracking-tighter">Debt Manager</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-brand text-black rounded-2xl font-bold hover:bg-brand/90 transition-all active:scale-95 shrink-0 shadow-[0_0_20px_rgba(206,255,89,0.2)]">
          <Plus className="w-5 h-5" />
          <span>Add Debt / Loan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <ArrowDownRight className="w-5 h-5" />
            <h3 className="font-bold text-sm">You Owe</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{formatCurrencyShort(totalBorrowed)}</p>
        </div>
        <div className="p-6 rounded-3xl bg-brand/5 border border-brand/10">
          <div className="flex items-center gap-3 text-brand mb-2">
            <ArrowUpRight className="w-5 h-5" />
            <h3 className="font-bold text-sm">Owed To You</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{formatCurrencyShort(totalLent)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'borrowed', 'lent'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === f ? 'bg-white/10 text-white' : 'bg-transparent text-white/50 hover:bg-white/5'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
           <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none">
             <option value="active">Active</option>
             <option value="paid">Paid</option>
           </select>
        </div>
      </div>

      {/* Debt List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredDebts.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-3xl">
              <Users className="w-8 h-8 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No debts found.</p>
            </div>
          ) : (
            filteredDebts.map(debt => (
              <motion.div key={debt.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 border border-white/10 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${debt.type === 'borrowed' ? 'bg-rose-500' : 'bg-brand'}`} />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{debt.contact}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${debt.type === 'borrowed' ? 'text-rose-400' : 'text-brand'}`}>
                      {debt.type === 'borrowed' ? 'You Borrowed' : 'You Lent'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-white mb-1">{formatCurrencyShort(debt.amount)}</p>
                    <p className="text-xs text-white/50">Remaining: {formatCurrencyShort(debt.remaining)}</p>
                  </div>
                </div>
                
                {debt.description && <p className="text-sm text-white/70 mb-4 bg-white/5 p-3 rounded-xl">{debt.description}</p>}
                
                {debt.dueDate && (
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                     <AlertCircle className="w-4 h-4" /> Due: {new Date(debt.dueDate).toLocaleDateString()}
                  </div>
                )}
                
                {debt.status === 'active' && (
                  <button onClick={() => handleMarkPaid(debt.id)} className="w-full py-2.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white/90 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                  </button>
                )}
                {debt.status === 'paid' && (
                  <div className="w-full py-2.5 rounded-xl font-bold text-sm text-center text-green-400 bg-green-500/10">
                    Paid
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AddDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}