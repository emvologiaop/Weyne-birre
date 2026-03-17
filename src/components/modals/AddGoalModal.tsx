import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.uid,
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount) || 0,
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: new Date(formData.targetDate).toISOString(),
        color: '#10B981',
        icon: 'Target',
      });
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'goals');
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
              <h2 className="text-xl font-semibold text-white">Create Goal</h2>
              <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="e.g. Emergency Fund"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Target Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Current Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Target Date</label>
                <input
                  type="date"
                  required
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
