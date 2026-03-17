import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { toast } from 'sonner';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#10b981',
    icon: 'Tag',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'categories'), {
        userId: user.uid,
        name: formData.name,
        type: formData.type,
        color: formData.color,
        icon: formData.icon,
      });
      toast.success('Category created');
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'categories');
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
              <h2 className="text-xl font-semibold text-white">New Category</h2>
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

              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'expense' ? 'bg-rose-500 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${formData.type === 'income' ? 'bg-emerald-500 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="e.g. Groceries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Color</label>
                <div className="flex gap-3">
                  {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-125 ring-2 ring-white/20' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
