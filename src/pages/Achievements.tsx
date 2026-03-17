import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'achievements'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAchievements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Achievements</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => (
          <div key={ach.id} className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{ach.name}</h3>
                <p className="text-sm text-white/50">{ach.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
