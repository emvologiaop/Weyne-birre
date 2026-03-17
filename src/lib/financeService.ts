import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function getSubscriptions(userId: string) {
  const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAchievements(userId: string) {
  const q = query(collection(db, 'achievements'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAccounts(userId: string) {
  const q = query(collection(db, 'accounts'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTransactions(userId: string) {
  const q = query(collection(db, 'transactions'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
