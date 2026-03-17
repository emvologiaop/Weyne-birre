import React, { useState } from 'react';
import { Trophy, Plus, Loader2, Star, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { PREDEFINED_ACHIEVEMENTS } from '../lib/constants';
import { AddAchievementModal } from '../components/modals/AddAchievementModal';
import { cn } from '../lib/utils';

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

  const unlockedCount = allAchievements.filter(a => a.isUnlocked).length;
  const completionRate = Math.round((unlockedCount / allAchievements.length) * 100) || 0;

  return (
    <div className="space-y-12 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest border border-brand/20">
              Personal Milestones
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter leading-none">
            Your <span className="text-brand italic">Legacy</span>
          </h2>
          <p className="text-sm text-white/40 max-w-md font-medium leading-relaxed">
            A chronicle of your financial discipline and strategic victories. Every milestone is a testament to your progress.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-brand text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-[0_0_40px_rgba(16,185,129,0.15)] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Record Milestone
        </button>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Milestones Unlocked', value: unlockedCount, icon: Trophy, color: 'brand', isCurrency: false },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: Star, color: 'brand', isCurrency: false },
          { label: 'Rarity Index', value: 'Elite', icon: CheckCircle2, color: 'brand', isCurrency: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[32px] bg-[#141414] border border-white/[0.03] relative overflow-hidden group shadow-2xl"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-[60px] group-hover:bg-brand/10 transition-all duration-700`} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-white tracking-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allAchievements.map((ach, index) => (
            <motion.div 
              key={ach.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className={cn(
                "p-8 rounded-[40px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border transition-all duration-500 group relative overflow-hidden shadow-2xl",
                ach.isUnlocked ? 'border-brand/20' : 'border-white/[0.03] opacity-60 grayscale-[0.5]'
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] transition-opacity duration-1000",
                ach.isUnlocked ? 'bg-brand/5 opacity-100' : 'bg-white/0 opacity-0'
              )} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-12">
                  <div className={cn(
                    "w-16 h-16 rounded-[24px] border flex items-center justify-center transition-all duration-700 shadow-2xl",
                    ach.isUnlocked 
                      ? 'bg-brand/10 border-brand/20 text-brand' 
                      : 'bg-white/[0.03] border-white/[0.05] text-white/10'
                  )}>
                    {ach.isUnlocked ? <Trophy className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                  </div>
                  {ach.isUnlocked && (
                    <div className="px-3 py-1 rounded-lg bg-brand/10 border border-brand/20 text-brand text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Achieved
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className={cn(
                      "font-display font-bold text-2xl tracking-tight transition-colors duration-500",
                      ach.isUnlocked ? 'text-white' : 'text-white/30'
                    )}>
                      {ach.name}
                    </h3>
                    <p className={cn(
                      "text-sm mt-2 leading-relaxed font-medium",
                      ach.isUnlocked ? 'text-white/40' : 'text-white/10'
                    )}>
                      {ach.description}
                    </p>
                  </div>

                  {ach.type === 'custom' && (
                    <div className="pt-6 border-t border-white/[0.03]">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-[9px] font-bold text-white/20 uppercase tracking-widest">
                        Custom Milestone
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddAchievementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
