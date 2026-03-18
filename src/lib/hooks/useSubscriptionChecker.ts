import { useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../../components/AuthProvider';
import { useSubscriptions, useTransactions } from './useFinanceData';
import { toast } from 'sonner';

export function useSubscriptionChecker() {
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { transactions } = useTransactions();
  const hasCheckedToday = useRef(false);

  useEffect(() => {
    // Only run once per app session per day
    if (hasCheckedToday.current) return;
    if (!user || !subscriptions) return;

    const checkDueSubscriptions = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const sub of subscriptions) {
        const startDate = new Date(sub.startDate);
        startDate.setHours(0, 0, 0, 0);

        if (startDate <= today) {
          // Bug fix: use tx.description (not tx.name) to match transactions
          const alreadyRecorded = transactions.some(tx =>
            tx.description === sub.name &&
            new Date(tx.date).toDateString() === today.toDateString()
          );

          if (!alreadyRecorded) {
            toast.info(`Subscription Due: ${sub.name}`, {
              description: `A payment of Br ${sub.amount} is due today. Would you like to record it?`,
              action: {
                label: 'Record',
                onClick: async () => {
                  try {
                    // Bug fix: save amount as negative and use 'description' field (not 'name')
                    await addDoc(collection(db, 'transactions'), {
                      userId: user.uid,
                      description: sub.name,
                      amount: -Math.abs(sub.amount),
                      type: 'expense',
                      date: today.toISOString(),
                      categoryId: sub.categoryId || 'uncategorized',
                      accountId: sub.accountId || '',
                      status: 'cleared',
                      tags: [],
                      createdAt: serverTimestamp()
                    });
                    // Bug fix: also update account balance
                    if (sub.accountId) {
                      await updateDoc(doc(db, 'accounts', sub.accountId), {
                        balance: increment(-Math.abs(sub.amount))
                      });
                    }
                    toast.success(`Payment for ${sub.name} recorded`);
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

    if (user && subscriptions.length > 0) {
      hasCheckedToday.current = true;
      checkDueSubscriptions();
    }
  }, [user, subscriptions.length, transactions.length]);
}
