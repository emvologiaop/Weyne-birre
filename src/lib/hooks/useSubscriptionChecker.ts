import { useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../../components/AuthProvider';
import { useSubscriptions, useTransactions } from './useFinanceData';
import { toast } from 'sonner';

export function useSubscriptionChecker() {
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { transactions } = useTransactions();

  useEffect(() => {
    if (!user || !subscriptions) return;

    const checkDueSubscriptions = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const sub of subscriptions) {
        const startDate = new Date(sub.startDate);
        startDate.setHours(0, 0, 0, 0);

        // Check if it's due today (simplified: check if start date is today or in the past and not yet recorded for this period)
        if (startDate <= today) {
          // Check if a transaction for this subscription already exists for today
          const alreadyRecorded = transactions.some(tx => 
            tx.name === sub.name && 
            new Date(tx.date).toDateString() === today.toDateString()
          );

          if (!alreadyRecorded) {
            toast.info(`Subscription Due: ${sub.name}`, {
              description: `A payment of ${sub.amount} is due today. Would you like to record it?`,
              action: {
                label: 'Record',
                onClick: async () => {
                  try {
                    await addDoc(collection(db, 'transactions'), {
                      userId: user.uid,
                      name: sub.name,
                      amount: -sub.amount,
                      type: 'expense',
                      date: today.toISOString(),
                      categoryId: sub.categoryId || 'other',
                      accountId: sub.accountId || 'default',
                      createdAt: serverTimestamp()
                    });
                    toast.success(`Recorded payment for ${sub.name}`);
                  } catch (error) {
                    console.error('Error recording subscription payment:', error);
                    toast.error('Failed to record payment');
                  }
                }
              }
            });
          }
        }
      }
    };

    checkDueSubscriptions();
  }, [user, subscriptions, transactions]);
}
