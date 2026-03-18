import { useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../../components/AuthProvider';
import { useTransactions, useBudgets, useAchievements } from './useFinanceData';
import { PREDEFINED_ACHIEVEMENTS } from '../constants';
import { toast } from 'sonner';
import { showAchievementUnlock } from '../notificationService';

export function useAchievementTracker() {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { achievements } = useAchievements();
  // Track which achievements we've already fired this session to prevent re-fire spam
  const firedThisSession = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || achievements.length === undefined) return;

    const hasAchievement = (id: string) =>
      achievements.some(a => a.id === id || a.achievementId === id) ||
      firedThisSession.current.has(id);

    const unlockAchievement = async (id: string) => {
      const predefined = PREDEFINED_ACHIEVEMENTS.find(p => p.id === id);
      if (!predefined) return;
      // Mark immediately so concurrent checks don't double-fire
      firedThisSession.current.add(id);
      try {
        await addDoc(collection(db, 'achievements'), {
          userId: user.uid,
          achievementId: predefined.id,
          name: predefined.name,
          description: predefined.description,
          icon: predefined.icon,
          unlockedAt: serverTimestamp(),
        });
        toast.success(`🏆 Achievement Unlocked: ${predefined.name}!`, {
          description: predefined.description,
        });
        showAchievementUnlock(predefined.name, predefined.description);
      } catch (error) {
        firedThisSession.current.delete(id);
        console.error('Error unlocking achievement:', error);
      }
    };

    const checkAchievements = async () => {
      // 1. First Step: add first transaction
      if (transactions.length > 0 && !hasAchievement('first_transaction')) {
        await unlockAchievement('first_transaction');
      }

      // 2. Penny Pincher: total recorded income >= 100
      const totalIncome = transactions
        .filter((tx: any) => tx.type === 'income')
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
      if (totalIncome >= 100 && !hasAchievement('saver_level_1')) {
        await unlockAchievement('saver_level_1');
      }

      // 3. Wealth Builder: total recorded income >= 1000
      if (totalIncome >= 1000 && !hasAchievement('wealth_builder')) {
        await unlockAchievement('wealth_builder');
      }

      // 4. Budget Master: has budgets and stayed within ALL of them this month
      if (budgets.length > 0 && !hasAchievement('budget_master')) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const allWithinBudget = budgets.every((budget: any) => {
          const spent = transactions
            .filter((tx: any) =>
              tx.categoryId === budget.categoryId &&
              tx.type === 'expense' &&
              new Date(tx.date) >= monthStart
            )
            .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
          return spent <= budget.amount;
        });
        if (allWithinBudget) {
          await unlockAchievement('budget_master');
        }
      }
    };

    checkAchievements();
  // Do NOT include achievements in deps — it would re-trigger on every unlock
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, transactions, budgets]);
}
