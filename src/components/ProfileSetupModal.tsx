import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from '../lib/constants';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    age: '',
    gender: 'prefer-not-to-say'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        age: Number(formData.age),
        profileCompleted: true
      });

      // Check if categories already exist before creating defaults
      const { getDocs, query, where } = await import('firebase/firestore');
      const existingCats = await getDocs(query(collection(db, 'categories'), where('userId', '==', user.uid)));
      if (existingCats.empty) {
        await Promise.all(DEFAULT_CATEGORIES.map(cat =>
          addDoc(collection(db, 'categories'), { ...cat, userId: user.uid })
        ));
      }

      // Check if accounts already exist before creating defaults
      const existingAccs = await getDocs(query(collection(db, 'accounts'), where('userId', '==', user.uid)));
      if (existingAccs.empty) {
        await Promise.all(DEFAULT_ACCOUNTS.map(acc =>
          addDoc(collection(db, 'accounts'), { ...acc, userId: user.uid })
        ));
      }

      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Complete Your Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Age</label>
                  <input required type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button disabled={isSaving} type="submit" className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors mt-6">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Complete Setup'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
