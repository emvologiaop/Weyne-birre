import React, { useState } from 'react';
import { Trophy, Plus, Loader2, Star, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { PREDEFINED_ACHIEVEMENTS } from '../lib/constants';
import { AddAchievementModal } from '../components/modals/AddAchievementModal';

export default function Achievements() {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'achievements'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnlockedAchievements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const allAchievements = [
    ...PREDEFINED_ACHIEVEMENTS.map(ach => ({
      ...ach,
      isUnlocked: unlockedAchievements.some(u => u.name === ach.name || u.id === ach.id),
      type: 'predefined'
    })),
    ...unlockedAchievements.filter(u => !PREDEFINED_ACHIEVEMENTS.some(p => p.name === u.name || p.id === u.id))
      .map(u => ({ ...u, isUnlocked: true, type: 'custom' }))
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">Achievements</h2>
          <p className="text-sm text-white/50 mt-1">Celebrate your financial milestones and successes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Achievement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAchievements.map((ach, index) => (
            <motion.div 
              layout
              key={ach.id || index} 
              className={`bg-gradient-to-br from-[#141414] to-[#0a0a0a] border rounded-3xl p-6 space-y-4 hover:border-white/20 transition-all group relative overflow-hidden ${ach.isUnlocked ? 'border-emerald-500/20' : 'border-white/10 opacity-60'}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-opacity ${ach.isUnlocked ? 'bg-emerald-500 opacity-10 group-hover:opacity-20' : 'bg-white opacity-0'}`} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${ach.isUnlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                  {ach.isUnlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                {ach.isUnlocked && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <h3 className={`font-semibold text-lg ${ach.isUnlocked ? 'text-white/90' : 'text-white/40'}`}>{ach.name}</h3>
                <p className={`text-sm mt-1 leading-relaxed ${ach.isUnlocked ? 'text-white/50' : 'text-white/20'}`}>{ach.description}</p>
              </div>

              {ach.type === 'custom' && (
                <div className="relative z-10 pt-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/30 font-medium uppercase tracking-widest">Custom Achievement</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AddAchievementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
}
