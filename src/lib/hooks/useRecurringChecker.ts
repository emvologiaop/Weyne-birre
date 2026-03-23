import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../../components/AuthProvider';
import { useRecurringTransactions } from './useFinanceData';
import { toast } from 'sonner';

function getNextDate(date: Date, interval: string): Date {
  const next = new Date(date);
  const origDay = next.getDate();
  switch (interval) {
    case 'daily': next.setDate(next.getDate() + 1); break;
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': {
      next.setMonth(next.getMonth() + 1);
      const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(origDay, maxDay));
      break;
    }
    case 'yearly': {
      next.setFullYear(next.getFullYear() + 1);
      const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(origDay, maxDay));
      break;
    }
  }
  return next;
}

export function useRecurringChecker() {
  const { user } = useAuth();
  const { recurring } = useRecurringTransactions();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || !recurring.length || checked.current) return;
    checked.current = true;

    const process = async () => {
      const today = new Date(); today.setHours(23, 59, 59, 999);

      for (const rec of recurring) {
        if (!rec.active) continue;
        if (rec.endDate && new Date(rec.endDate) < new Date()) continue;

        let nextDue = new Date(rec.nextDueDate);
        if (nextDue > today) continue;

        // Fire all missed occurrences
        while (nextDue <= today) {
          const finalAmount = rec.type === 'expense' ? -Math.abs(rec.amount) : Math.abs(rec.amount);
          try {
            await runTransaction(db, async (transaction) => {
              const accountRef = doc(db, 'accounts', rec.accountId);
              const accountSnap = await transaction.get(accountRef);
              
              const newTxRef = doc(collection(db, 'transactions'));
              transaction.set(newTxRef, {
                userId: user.uid,
                accountId: rec.accountId,
                categoryId: rec.categoryId || 'uncategorized',
                amount: finalAmount,
                date: nextDue.toISOString(),
                description: rec.description,
                type: rec.type,
                status: 'cleared',
                tags: ['recurring'],
                recurringId: rec.id,
                isRecurring: true,
              });

              if (accountSnap.exists()) {
                const currentBalance = accountSnap.data().balance || 0;
                transaction.update(accountRef, { balance: currentBalance + finalAmount });
              }
            });

            toast.success(`Recurring: ${rec.description}`, {
              description: `${rec.type === 'expense' ? 'Debited' : 'Credited'} Br ${rec.amount.toLocaleString()}`,
            });
          } catch (e) {
            console.error('Recurring tx error:', e);
            break; // Stop processing this recurring tx on error
          }

          nextDue = getNextDate(nextDue, rec.interval);
          if (rec.endDate && nextDue > new Date(rec.endDate)) break;
        }

        // Update next due date
        await updateDoc(doc(db, 'recurringTransactions', rec.id), {
          nextDueDate: nextDue.toISOString(),
          lastProcessed: serverTimestamp(),
        });
      }
    };

    process();
  }, [user, recurring]);
}
