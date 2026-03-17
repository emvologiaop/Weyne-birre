import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import ProfileSetupModal from './ProfileSetupModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  profileCompleted: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          try {
            const displayName = firebaseUser.displayName;
            const name = (displayName && !displayName.startsWith('Firebase')) 
              ? displayName 
              : (firebaseUser.email?.split('@')[0] || 'User');

            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: name,
              email: firebaseUser.email || '',
              role: 'user',
              currency: 'ETB',
              theme: 'dark',
              monthlyIncomeGoal: 5000,
              netWorthTarget: 100000,
              profileCompleted: false
            });

            const defaultCategories = [
              { name: 'Housing', type: 'expense', color: '#3b82f6', icon: 'Home' },
              { name: 'Food', type: 'expense', color: '#f59e0b', icon: 'Coffee' },
              { name: 'Transportation', type: 'expense', color: '#10b981', icon: 'Car' },
              { name: 'Utilities', type: 'expense', color: '#8b5cf6', icon: 'Zap' },
              { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'Film' },
              { name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase' },
              { name: 'Investments', type: 'income', color: '#6366f1', icon: 'TrendingUp' },
              { name: 'Other', type: 'income', color: '#94a3b8', icon: 'Plus' }
            ];

            const { collection, addDoc } = await import('firebase/firestore');
            for (const cat of defaultCategories) {
              await addDoc(collection(db, 'categories'), {
                ...cat,
                userId: firebaseUser.uid
              });
            }
            setProfileCompleted(false);
          } catch (error) {
            console.error("Error creating user document or categories:", error);
          }
        } else {
          const userData = userSnap.data();
          if (userData.name && userData.name.startsWith('Firebase')) {
             const displayName = firebaseUser.displayName;
             const newName = (displayName && !displayName.startsWith('Firebase')) 
              ? displayName 
              : (firebaseUser.email?.split('@')[0] || 'User');
             await updateDoc(userRef, { name: newName });
          }
          setProfileCompleted(userSnap.data().profileCompleted !== false);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/50 text-sm font-medium">Loading WealthTracker...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141414] border border-white/10 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to WealthTracker</h1>
            <p className="text-white/50 text-sm">Sign in to manage your finances securely.</p>
          </div>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, profileCompleted }}>
      <ProfileSetupModal isOpen={!profileCompleted} onComplete={() => setProfileCompleted(true)} />
      {children}
    </AuthContext.Provider>
  );
}
