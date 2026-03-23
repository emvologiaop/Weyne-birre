import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { toast } from 'sonner';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDebtModal({ isOpen, onClose }: AddDebtModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    type: 'borrowed' as 'borrowed' | 'lent',
    contact: '',
    amount: '',
    dueDate: '',
    description: ''
  });

  const reset = () => {
    setForm({ type: 'borrowed', contact: '', amount: '', dueDate: '', description: '' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const amountNum = parseFloat(form.amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid amount');
      
      await addDoc(collection(db, 'debts'), {
        userId: user.uid,
        type: form.type,
        contact: form.contact.trim(),
        amount: amountNum,
        remaining: amountNum,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        description: form.description.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      });

      toast.success(form.type === 'borrowed' ? 'Debt recorded!' : 'Loan recorded!');
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add debt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white">Record Debt / Loan</h2>
              <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-sm text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.02] border border-white/10 rounded-xl mb-6">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'borrowed' }))}
                  className={`py-2 text-sm font-bold rounded-lg transition-all ${form.type === 'borrowed' ? 'bg-rose-500/20 text-rose-400' : 'text-white/50 hover:text-white/80'}`}>
                  I Borrowed
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'lent' }))}
                  className={`py-2 text-sm font-bold rounded-lg transition-all ${form.type === 'lent' ? 'bg-brand/20 text-brand' : 'text-white/50 hover:text-white/80'}`}>
                  I Lent
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Who? (Contact Name)</label>
                <input type="text" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors"
                  placeholder="e.g. John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Amount</label>
                <input type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors"
                  placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Due Date (Optional)</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Description / Reason</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors"
                  placeholder="Rent split, lunch, etc." />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-brand text-black rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}