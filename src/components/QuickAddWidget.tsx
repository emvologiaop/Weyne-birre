import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { useAccounts, useCategories } from '../lib/hooks/useFinanceData';
import { toast } from 'sonner';
import { cn } from "../lib/utils";

export function QuickAddWidget() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: N to open quick add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 100);
  }, [open]);

  // Auto-select first account/category
  useEffect(() => {
    if (accounts.length && !accountId) setAccountId(accounts[0].id);
  }, [accounts]);

  useEffect(() => {
    const firstCat = categories.find(c => c.type === type);
    if (firstCat && !categoryId) setCategoryId(firstCat.id);
  }, [categories, type]);

  const reset = () => { setAmount(''); setDescription(''); setCategoryId(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !accountId) return;
    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      const finalAmount = type === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum);
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId,
        categoryId: categoryId || 'uncategorized',
        amount: finalAmount,
        date: new Date().toISOString(),
        description: description || (type === 'expense' ? 'Quick expense' : 'Quick income'),
        type,
        status: 'cleared',
        tags: ['quick-add'],
        isRecurring: false,
      });
      await updateDoc(doc(db, 'accounts', accountId), { balance: increment(finalAmount) });
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} of Br ${amountNum.toLocaleString()} saved!`);
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCats = categories.filter(c => c.type === type);

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-brand text-black shadow-[0_8px_32px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all"
        title="Quick add (N)"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Quick-add panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] bg-black/30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-44 right-6 z-[60] w-80 bg-[#141414] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
                <p className="text-sm font-bold text-white">Quick Add <span className="ml-2 text-[10px] text-white/20 font-normal bg-white/5 px-2 py-0.5 rounded-md">N</span></p>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {/* Type toggle */}
                <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
                  {(['expense', 'income'] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                      className={cn('flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize',
                        type === t ? (t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white') : 'text-white/40 hover:text-white')}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">Br</span>
                  <input ref={amountRef} type="number" step="0.01" min="0.01" required value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand/50"
                    placeholder="Amount" />
                </div>

                {/* Description */}
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand/50"
                  placeholder="What for? (optional)" />

                {/* Account + Category */}
                <div className="grid grid-cols-2 gap-2">
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} required
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-brand/50 appearance-none">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-brand/50 appearance-none">
                    <option value="">Category</option>
                    {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={loading || !amount}
                  className="w-full py-2.5 bg-brand text-black text-sm font-bold rounded-xl hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
