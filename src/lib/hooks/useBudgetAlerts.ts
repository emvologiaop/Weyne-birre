
import { useEffect, useRef } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useBudgets, useTransactions } from './useFinanceData';
import { toast } from 'sonner';
import { isSameMonth } from 'date-fns';

export function useBudgetAlerts() {
  const { user } = useAuth();
  const { budgets } = useBudgets();
  const { transactions } = useTransactions();
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || budgets.length === 0 || transactions.length === 0) return;

    const now = new Date();
    
    budgets.forEach(budget => {
      const budgetTransactions = transactions.filter(t => 
        t.categoryId === budget.categoryId && 
        t.type === 'expense' &&
        isSameMonth(new Date(t.date), now)
      );

      const totalSpent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentage = (totalSpent / budget.amount) * 100;

      // Ensure we don't spam toasts
      if (percentage >= 100) {
        const key = `${budget.id}-100-${now.getMonth()}`;
        if (!alertedRef.current.has(key)) {
          toast.error(`Budget Exceeded!`, {
            description: `You have spent ${percentage.toFixed(0)}% of your budget for this category.`,
            duration: 8000
          });
          alertedRef.current.add(key);
        }
      } else if (percentage >= 80) {
        const key = `${budget.id}-80-${now.getMonth()}`;
        if (!alertedRef.current.has(key)) {
          toast.warning(`Budget Warning`, {
            description: `You have spent ${percentage.toFixed(0)}% of your budget for this category.`,
            duration: 8000
          });
          alertedRef.current.add(key);
        }
      }
    });

  }, [budgets, transactions, user]);
}