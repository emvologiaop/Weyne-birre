import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { useAccounts, useCategories } from '../../lib/hooks/useFinanceData';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { toast } from 'sonner';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    categoryId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const amountNum = parseFloat(formData.amount);
      const finalAmount = formData.type === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum);

      // Save the transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId: formData.accountId,
        categoryId: formData.categoryId || 'uncategorized',
        amount: finalAmount,
        date: new Date(formData.date).toISOString(),
        description: formData.description,
        type: formData.type,
        status: 'cleared',
        tags: []
      });

      // Update the account balance — add for income, subtract for expense
      await updateDoc(doc(db, 'accounts', formData.accountId), {
        balance: increment(finalAmount)
      });

      toast.success('Transaction saved!');
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: '',
        categoryId: '',
      });
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'transactions');
      } catch (e: any) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">New Transaction</h2>
              <button onClick={onClose} className="p-2 text-white/78 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'expense' ? 'bg-rose-500 text-white' : 'text-white/78 hover:text-white'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'income' ? 'bg-emerald-500 text-white' : 'text-white/78 hover:text-white'}`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/78 text-sm font-bold">Br</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/65 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/65 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="What was this for?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Account</label>
                  <select
                    required
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                  >
                    <option value="" disabled>Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.length === 0 ? (
                    <option value="" disabled>No categories found. Please add some first.</option>
                  ) : (
                    <>
                      {categories.filter(c => c.type === formData.type).length === 0 ? (
                        <option value="" disabled>No {formData.type} categories — add one first</option>
                      ) : (
                        categories.filter(c => c.type === formData.type).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      )}
                    </>
                  )}
                </select>
                {categories.filter(c => c.type === formData.type).length === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5">
                    No {formData.type} categories yet. Go to{' '}
                    <a href="/categories" className="underline hover:text-amber-300">Categories</a> to add some.
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
