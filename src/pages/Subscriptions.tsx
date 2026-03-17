import React, { useState } from 'react';
import { Plus, CreditCard, Trash2 } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subscriptions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{sub.name}</h3>
                  <p className="text-sm text-white/50">{sub.frequency}</p>
                </div>
              </div>
              <button onClick={() => deleteSubscription(sub.id)} className="text-white/30 hover:text-red-400">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(sub.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
