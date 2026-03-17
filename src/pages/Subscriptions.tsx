import React, { useState } from 'react';
import { Plus, CreditCard, Trash2, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';
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
    if (!window.confirm('Are you sure you want to remove this subscription?')) return;
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
      toast.success('Subscription removed');
    } catch (error) {
      toast.error('Failed to remove subscription');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">Subscriptions</h2>
          <p className="text-sm text-white/50 mt-1">Manage your recurring payments and services</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] rounded-3xl border border-white/10 shadow-xl">
          <div className="flex flex-col items-center justify-center text-white/40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-base">No subscriptions found.</p>
            <p className="text-sm mt-1">Add your recurring services like Netflix or Spotify.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => (
            <motion.div 
              layout
              key={sub.id} 
              className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-6 hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-emerald-500 opacity-5 group-hover:opacity-10 transition-opacity" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg group-hover:bg-white/10 transition-colors">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white/90">{sub.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {sub.frequency}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteSubscription(sub.id)} 
                  className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-white font-mono">{formatCurrency(sub.amount)}</div>
                  <p className="text-xs text-white/30 mt-1">Next payment: {new Date(sub.startDate).toLocaleDateString()}</p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Active
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddSubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
}
