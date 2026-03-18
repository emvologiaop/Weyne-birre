import React, { useState } from 'react';
import { Plus, CreditCard, Trash2, Loader2, Calendar, TrendingUp, Zap, Clock } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { AddSubscriptionModal } from '../components/modals/AddSubscriptionModal';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const deleteSubscription = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
      toast.success('Subscription removed');
    } catch (error) {
      toast.error('Failed to remove subscription');
    }
  };

  const monthlyTotal = subscriptions.reduce((sum, sub) => {
    const amount = sub.amount || 0;
    if (sub.frequency === 'yearly') return sum + amount / 12;
    if (sub.frequency === 'weekly') return sum + amount * 52 / 12;  // exact: 52 weeks / 12 months
    return sum + amount; // monthly
  }, 0);

  // Helper: compute the next billing date from a start date and frequency
  const getNextBillingDate = (startDate: string, frequency: string): Date => {
    const start = new Date(startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const originalDay = start.getDate(); // preserve original day-of-month
    let next = new Date(start);
    if (frequency === 'monthly') {
      while (next <= now) {
        next.setMonth(next.getMonth() + 1);
        // Re-clamp to original day to prevent month-end drift (Jan 31 -> Feb 28 -> Mar 28 bug)
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(originalDay, maxDay));
      }
    } else if (frequency === 'yearly') {
      while (next <= now) {
        next.setFullYear(next.getFullYear() + 1);
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(originalDay, maxDay));
      }
    } else if (frequency === 'weekly') {
      while (next <= now) next.setDate(next.getDate() + 7);
    }
    return next;
  };

  return (
    <div className="space-y-24 pb-32">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em]">Your Subscriptions</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase">
              Digital<br />
              <span className="text-blue-400">Subscriptions</span>
            </h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-blue-500 text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: 'Monthly Cost', value: monthlyTotal, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', accent: 'bg-blue-500' },
          { label: 'Yearly Cost', value: monthlyTotal * 12, icon: Zap, color: 'text-brand', bg: 'bg-brand/10', accent: 'bg-brand' },
          { label: 'Total Active', value: subscriptions.length, icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10', accent: 'bg-rose-500', isCurrency: false },
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
                  {stat.isCurrency === false ? stat.value : formatCurrencyShort(stat.value as number)}
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
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-48 bg-white/[0.01] rounded-[64px] border border-white/[0.03] shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="w-28 h-28 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-10 shadow-2xl">
              <CreditCard className="w-12 h-12 text-white/5" />
            </div>
            <h3 className="text-3xl font-display font-bold text-white mb-4">No Subscriptions Yet</h3>
            <p className="text-sm text-white/20 max-w-xs mx-auto leading-relaxed">Add your recurring payments like Netflix, Spotify, or rent.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {subscriptions.map((sub, i) => (
            <motion.div 
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-30 transition-all duration-1000" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-12">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/20 group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-700 shadow-2xl">
                      <Zap className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white text-3xl tracking-tight group-hover:text-blue-400 transition-colors duration-500">{sub.name}</h3>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                          {sub.frequency}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em]">Active</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSubscription(sub.id)} 
                    className="p-4 text-white/5 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 duration-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em]">Amount</p>
                      <p className="text-5xl font-display font-bold text-white tracking-tighter tabular-nums">
                        {formatCurrencyShort(sub.amount)}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">Billing</p>
                      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.4em]">{sub.frequency === 'yearly' ? 'Yearly' : sub.frequency === 'weekly' ? 'Weekly' : 'Monthly'}</p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/[0.03] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-white/20" />
                      <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.4em]">
                        Next: {getNextBillingDate(sub.startDate, sub.frequency).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-white/20" />
                      <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.4em] italic">Auto-renew</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddSubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
