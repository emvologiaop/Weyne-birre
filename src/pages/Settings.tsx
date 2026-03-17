import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, Globe, Save, Loader2, Database, RefreshCw, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile, useCategories, useAccounts } from "../lib/hooks/useFinanceData";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../components/AuthProvider";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from "../lib/constants";
import { useRegisterSW } from 'virtual:pwa-register/react';

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data Management", icon: Database },
  { id: "pwa", label: "App Settings", icon: Smartphone },
  { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needUpdate: [needUpdate, setNeedUpdate],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    gender: "Male",
    monthlyIncomeGoal: 0,
    netWorthTarget: 0,
    currency: "ETB",
    theme: "dark"
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        username: profile.username || "",
        gender: profile.gender || "Male",
        monthlyIncomeGoal: profile.monthlyIncomeGoal || 0,
        netWorthTarget: profile.netWorthTarget || 0,
        currency: profile.currency || "ETB",
        theme: profile.theme || "dark"
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyIncomeGoal' || name === 'netWorthTarget' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        username: formData.username,
        gender: formData.gender,
        monthlyIncomeGoal: formData.monthlyIncomeGoal,
        netWorthTarget: formData.netWorthTarget,
        currency: formData.currency,
        theme: formData.theme
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitializeData = async () => {
    if (!user) return;
    if (!window.confirm("This will add default categories and accounts. Existing data will not be deleted. Continue?")) return;

    setIsInitializing(true);
    try {
      // Create default categories if none exist or just add them
      const categoriesRef = collection(db, 'categories');
      const accountsRef = collection(db, 'accounts');

      const promises = [];

      // Only add if they don't have them? Or just add all.
      // To be safe, let's just add them.
      
      DEFAULT_CATEGORIES.forEach(cat => {
        // Check if category already exists by name?
        const exists = categories.some(c => c.name === cat.name);
        if (!exists) {
          promises.push(addDoc(categoriesRef, { ...cat, userId: user.uid }));
        }
      });

      DEFAULT_ACCOUNTS.forEach(acc => {
        const exists = accounts.some(a => a.name === acc.name);
        if (!exists) {
          promises.push(addDoc(accountsRef, { ...acc, userId: user.uid }));
        }
      });

      await Promise.all(promises);
      toast.success("Default data initialized successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'data');
      toast.error("Failed to initialize data");
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">Settings</h2>
          <p className="text-sm text-white/50 mt-1">Manage your account and preferences</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="p-8 rounded-3xl bg-[#141414] border border-white/10">
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 border-4 border-[#141414] shadow-xl relative group cursor-pointer">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-white">Change</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white/90">Profile Picture</h3>
                    <p className="text-sm text-white/50 mb-3">Managed by Google Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Email Address</label>
                    <input 
                      type="email" 
                      value={profile?.email || user?.email || ""} 
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white/50 cursor-not-allowed focus:outline-none" 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Monthly Income Goal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">ETB</span>
                      <input 
                        type="number" 
                        name="monthlyIncomeGoal"
                        value={formData.monthlyIncomeGoal} 
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Net Worth Target</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                      <input 
                        type="number" 
                        name="netWorthTarget"
                        value={formData.netWorthTarget} 
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Currency & Region</h4>
                        <p className="text-sm text-white/50">Your primary currency for all calculations</p>
                      </div>
                    </div>
                    <select 
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Theme</h4>
                        <p className="text-sm text-white/50">Choose your preferred interface theme</p>
                      </div>
                    </div>
                    <div className="flex bg-black/20 border border-white/10 rounded-xl p-1">
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, theme: 'dark' }))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.theme === 'dark' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                      >
                        Dark
                      </button>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, theme: 'light' }))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.theme === 'light' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                      >
                        Light
                      </button>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, theme: 'system' }))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.theme === 'system' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                      >
                        System
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Email Notifications</h4>
                        <p className="text-sm text-white/50">Receive monthly summaries and alerts</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Budget Alerts</h4>
                        <p className="text-sm text-white/50">Get notified when you exceed 80% of a budget</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Initialize Default Data</h4>
                        <p className="text-sm text-white/50">Add standard categories and accounts to your profile</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/40 mb-6">
                      If you're missing categories or accounts in your dropdowns, use this to quickly set up standard options like "Food", "Transportation", "Cash", and "Bank Account".
                    </p>
                    <button 
                      onClick={handleInitializeData}
                      disabled={isInitializing}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white/90 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                    >
                      {isInitializing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                      Initialize Defaults
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "pwa" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">App Installation</h4>
                        <p className="text-sm text-white/50">Install ወይኔ ብሬ on your device for a better experience</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/40 mb-6">
                      Installing the app allows you to access it directly from your home screen, use it offline, and receive push notifications more reliably.
                    </p>
                    <button 
                      onClick={handleInstall}
                      disabled={!deferredPrompt}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {deferredPrompt ? 'Install App' : 'App Already Installed'}
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Updates & Offline</h4>
                        <p className="text-sm text-white/50">Manage app updates and offline status</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="text-sm">
                          <p className="text-white/90 font-medium">Offline Status</p>
                          <p className="text-white/40 text-xs">{offlineReady ? 'Ready for offline use' : 'Connecting...'}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${offlineReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                      </div>

                      {needUpdate && (
                        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <div className="text-sm">
                            <p className="text-emerald-400 font-medium">Update Available!</p>
                            <p className="text-emerald-400/60 text-xs">A new version of the app is available.</p>
                          </div>
                          <button 
                            onClick={() => updateServiceWorker(true)}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                          >
                            Update Now
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white/90 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Check for Updates
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Two-Factor Authentication</h4>
                        <p className="text-sm text-white/50">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-white/5 text-white/90 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">Connected Accounts</h4>
                        <p className="text-sm text-white/50">Manage third-party connections</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-white/5 text-white/90 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10">
                      Manage
                    </button>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium text-rose-400 mb-2">Danger Zone</h4>
                    <p className="text-sm text-white/50 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
