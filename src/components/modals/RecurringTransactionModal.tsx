import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { useAccounts, useCategories } from '../../lib/hooks/useFinanceData';
import { toast } from 'sonner';
import { RECURRING_INTERVALS } from '../../lib/constants';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecurringTransactionModal({ isOpen, onClose }: RecurringTransactionModalProps) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'expense' as 'expense' | 'income',
    amount: '',
    description: '',
    categoryId: '',
    accountId: '',
    interval: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const reset = () => {
    setForm({ type: 'expense', amount: '', description: '', categoryId: '', accountId: '', interval: 'monthly', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'recurringTransactions'), {
        userId: user.uid,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        categoryId: form.categoryId || 'uncategorized',
        accountId: form.accountId,
        interval: form.interval,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        nextDueDate: new Date(form.startDate).toISOString(),
        active: true,
        createdAt: new Date().toISOString(),
        lastProcessed: null,
      });
      toast.success('Recurring transaction set up!');
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create recurring transaction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCats = categories.filter(c => c.type === form.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Recurring Transaction</h2>
              <p className="text-xs text-white/30">Auto-reminders on a schedule</p>
            </div>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t, categoryId: '' })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${form.type === t ? (t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white') : 'text-white/50 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <input type="text" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50 transition-colors"
              placeholder="e.g. Monthly rent, Weekly groceries" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Amount (ETB)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm font-bold">Br</span>
              <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50 transition-colors"
                placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Account</label>
              <select required value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors appearance-none">
                <option value="" disabled>Select</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
              <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors appearance-none">
                <option value="" disabled>Select</option>
                {filteredCats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Repeat Every</label>
            <div className="grid grid-cols-3 gap-2">
              {RECURRING_INTERVALS.map(iv => (
                <button key={iv.value} type="button" onClick={() => setForm({ ...form, interval: iv.value })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${form.interval === iv.value ? 'bg-brand text-black border-brand' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}>
                  {iv.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Start Date</label>
              <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">End Date <span className="text-white/20">(optional)</span></label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                min={form.startDate}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-black font-bold rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Set Up Recurring</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
