import React, { useState } from 'react';
import { Plus, Receipt as ReceiptIcon } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AddReceiptModal } from '../components/modals/AddReceiptModal';
import { formatCurrency } from '../lib/utils';

export default function Receipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'receipts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReceipts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">Receipts</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-medium rounded-xl hover:bg-emerald-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Scan Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <ReceiptIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{receipt.merchant}</h3>
                <p className="text-sm text-white/50">{receipt.date}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(receipt.amount)}</div>
          </div>
        ))}
      </div>

      <AddReceiptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
