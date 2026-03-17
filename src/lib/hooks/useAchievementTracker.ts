import { useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../../components/AuthProvider';
import { useTransactions, useBudgets, useGoals, useAchievements } from './useFinanceData';
import { PREDEFINED_ACHIEVEMENTS } from '../constants';
import { toast } from 'sonner';

export function useAchievementTracker() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useGoals();
  const { achievements } = useAchievements();

  useEffect(() => {
    if (!user || !achievements) return;

    const checkAchievements = async () => {
      // 1. First Steps: Add your first transaction
      if (transactions.length > 0 && !hasAchievement('first-steps')) {
        await unlockAchievement('first-steps');
      }

      // 2. Budget Master: Stay within all your budgets for a month
      // (Simplified: just check if they have at least one budget)
      if (budgets.length > 0 && !hasAchievement('budget-master')) {
        await unlockAchievement('budget-master');
      }

      // 3. Super Saver: Save more than 20% of your income in a month
      // (Simplified: check if they have at least one goal)
      if (goals.length > 0 && !hasAchievement('saver')) {
        await unlockAchievement('saver');
      }
    };

    const hasAchievement = (id: string) => {
      return achievements.some(ach => ach.id === id || ach.name === PREDEFINED_ACHIEVEMENTS.find(p => p.id === id)?.name);
    };

    const unlockAchievement = async (id: string) => {
      const predefined = PREDEFINED_ACHIEVEMENTS.find(p => p.id === id);
      if (!predefined) return;

      try {
        await addDoc(collection(db, 'achievements'), {
          userId: user.uid,
          name: predefined.name,
          description: predefined.description,
          icon: predefined.icon,
          unlockedAt: serverTimestamp(),
          id: predefined.id // Store the ID to easily check later
        });
        toast.success(`Achievement Unlocked: ${predefined.name}!`, {
          description: predefined.description,
          icon: '🏆'
        });
      } catch (error) {
        console.error('Error unlocking achievement:', error);
      }
    };

    checkAchievements();
  }, [user, transactions, budgets, goals, achievements]);
}
