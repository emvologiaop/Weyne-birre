import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { useAccounts } from '../../lib/hooks/useFinanceData';
import { toast } from 'sonner';
import { APP_CURRENCY_SYMBOL } from '../../lib/constants';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: 'Transfer',
    date: new Date().toISOString().split('T')[0],
  });

  const fromAccount = accounts.find(a => a.id === form.fromAccountId);
  const toAccount = accounts.find(a => a.id === form.toAccountId);
  const amountNum = parseFloat(form.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.fromAccountId === form.toAccountId) {
      setError('From and To accounts must be different.');
      return;
    }
    if (amountNum <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (fromAccount && fromAccount.balance < amountNum) {
      setError(`Not enough balance in ${fromAccount.name}. Available: ${APP_CURRENCY_SYMBOL} ${fromAccount.balance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setError('');
    const dateISO = new Date(form.date).toISOString();

    try {
      const transferId = `transfer_${Date.now()}`;
      // Debit from source account
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: -amountNum,
        date: dateISO,
        description: `${form.description} → ${toAccount?.name ?? ''}`,
        type: 'transfer',
        status: 'cleared',
        transferId,
        tags: ['transfer'],
        categoryId: 'transfer',
        isRecurring: false,
      });
      // Credit to destination account
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId: form.toAccountId,
        fromAccountId: form.fromAccountId,
        amount: amountNum,
        date: dateISO,
        description: `${form.description} ← ${fromAccount?.name ?? ''}`,
        type: 'transfer',
        status: 'cleared',
        transferId,
        tags: ['transfer'],
        categoryId: 'transfer',
        isRecurring: false,
      });
      // Update balances atomically
      await updateDoc(doc(db, 'accounts', form.fromAccountId), { balance: increment(-amountNum) });
      await updateDoc(doc(db, 'accounts', form.toAccountId), { balance: increment(amountNum) });

      toast.success(`Transferred ${APP_CURRENCY_SYMBOL} ${amountNum.toLocaleString()} to ${toAccount?.name}`);
      setForm({ fromAccountId: '', toAccountId: '', amount: '', description: 'Transfer', date: new Date().toISOString().split('T')[0] });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Transfer Between Accounts</h2>
            <p className="text-xs text-white/30 mt-0.5">Move money from one account to another</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}

          {/* Visual transfer flow */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/70 mb-1.5">From Account</label>
              <select required value={form.fromAccountId} onChange={e => setForm({ ...form, fromAccountId: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500/50 transition-colors appearance-none">
                <option value="" disabled>Select</option>
                {accounts.filter(a => a.id !== form.toAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (Br {(acc.balance || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div className="mt-6">
              <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-brand" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/70 mb-1.5">To Account</label>
              <select required value={form.toAccountId} onChange={e => setForm({ ...form, toAccountId: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors appearance-none">
                <option value="" disabled>Select</option>
                {accounts.filter(a => a.id !== form.fromAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm font-bold">Br</span>
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50 transition-colors"
                placeholder="0.00" />
            </div>
            {fromAccount && amountNum > 0 && (
              <p className={`text-xs mt-1.5 ${amountNum > fromAccount.balance ? 'text-rose-400' : 'text-white/30'}`}>
                Available in {fromAccount.name}: Br {(fromAccount.balance || 0).toLocaleString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Note (optional)</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-brand/50 transition-colors"
                placeholder="Transfer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Date</label>
              <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-black font-bold rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Transfer <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
