import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, AlertCircle, Loader2, PieChart, Trash2, TrendingUp, Trophy } from "lucide-react";
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { useBudgets, useGoals, useCategories, useTransactions } from "../lib/hooks/useFinanceData";
import { AddBudgetModal } from "../components/modals/AddBudgetModal";
import { AddGoalModal } from "../components/modals/AddGoalModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { showBudgetAlert, isNotificationGranted } from "../lib/notificationService";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function Budgets() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { goals, loading: goalsLoading } = useGoals();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
      toast.success('Budget deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'budgets');
      toast.error('Failed to delete budget');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
      toast.success('Goal deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'goals');
      toast.error('Failed to delete goal');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "Unknown";
  };

  const getCategorySpent = (categoryId: string, period: string = 'monthly') => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let periodStart = new Date();
    if (period === 'weekly') {
      // Start from Monday (1) not Sunday (0) for standard work week
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - daysToMonday);
      periodStart.setHours(0, 0, 0, 0);
    } else if (period === 'yearly') {
      periodStart = new Date(now.getFullYear(), 0, 1);
    } else {
      // monthly (default)
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return transactions
      .filter(tx => tx.categoryId === categoryId && tx.type === 'expense')
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= periodStart && txDate <= now;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  return (
    <div className="space-y-24 pb-32">
      {/* Editorial Header */}
      <div className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20" />
            <p className="text-[10px] font-bold text-white/72 uppercase tracking-[0.5em]">Budgets & Goals</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-[0.85] uppercase">
              Capital<br />
              <span className="text-brand">Strategy</span>
            </h1>
            <div className="flex gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[24px] bg-white/[0.03] border border-white/[0.05] text-[10px] font-bold uppercase tracking-[0.2em] text-white/84 hover:bg-white/[0.08] hover:text-white transition-all duration-500 active:scale-95 shadow-xl backdrop-blur-xl"
              >
                <Target className="w-4 h-4" />
                New Goal
              </button>
              <button 
                onClick={() => setIsBudgetModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-[24px] bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand hover:text-white transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Budget
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { label: "Total Budgeted", value: budgets.reduce((sum, b) => sum + b.amount, 0), icon: PieChart, color: "text-blue-400", bg: "bg-blue-400/10", accent: "bg-blue-500" },
          { label: "Total Spent", value: budgets.reduce((sum, b) => sum + getCategorySpent(b.categoryId, b.period), 0), icon: TrendingUp, color: "text-rose-400", bg: "bg-rose-400/10", accent: "bg-rose-500" },
          { label: "Money Remaining", value: Math.max(0, budgets.reduce((sum, b) => sum + b.amount, 0) - budgets.reduce((sum, b) => sum + getCategorySpent(b.categoryId, b.period), 0)), icon: Trophy, color: "text-brand", bg: "bg-brand/10", accent: "bg-brand" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group hover:bg-white/[0.03] transition-all duration-700"
          >
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700", stat.accent)} />
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.4em]">{stat.label}</p>
                <h3 className="text-4xl font-display font-bold text-white tracking-tight tabular-nums">
                  {formatCurrencyShort(stat.value)}
                </h3>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] shadow-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Budgets */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-2 h-10 bg-brand rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
            <h3 className="text-3xl font-display font-bold text-white tracking-tight">Monthly Budgets</h3>
          </div>
          <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.4em]">This Period</p>
        </div>

        {budgetsLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-brand animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-48 bg-white/[0.01] rounded-[64px] border border-white/[0.03] shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="w-28 h-28 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-10 shadow-2xl">
                <PieChart className="w-12 h-12 text-white/35" />
              </div>
              <h4 className="text-3xl font-display font-bold text-white mb-4">No Budgets Yet</h4>
              <p className="text-sm text-white/55 max-w-xs mx-auto leading-relaxed">Create your first budget to start controlling your spending.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {budgets.map((budget, i) => {
              const spent = getCategorySpent(budget.categoryId, budget.period);
              const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : (spent > 0 ? 100 : 0);
              const isOver = spent > budget.amount;
              const isWarning = percentage >= 85 && !isOver;
              // Fire browser notification when budget hits 85% or goes over (once per render via ref)

              return (
                <motion.div 
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                >
                  <div className={cn(
                    "absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000 opacity-0 group-hover:opacity-30",
                    isOver ? 'bg-rose-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-brand/20'
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[32px] flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/55 group-hover:bg-white/[0.05] group-hover:text-white/72 transition-all duration-700 shadow-2xl">
                          <TrendingUp className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-3xl tracking-tight">{getCategoryName(budget.categoryId)}</h4>
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className={cn("w-2 h-2 rounded-full", isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : isWarning ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-brand shadow-[0_0_10px_rgba(16,185,129,0.5)]')} />
                            <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.3em]">{formatCurrencyShort(budget.amount)} limit</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {isOver && (
                          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-rose-500/20 shadow-2xl backdrop-blur-md">
                            <AlertCircle className="w-4 h-4" />
                            Over Limit
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBudget(budget.id);
                          }}
                          className="p-4 text-white/35 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex justify-between items-end">
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.4em]">Spent So Far</p>
                          <p className="text-4xl font-display font-bold text-white tracking-tight tabular-nums">{formatCurrencyShort(spent)}</p>
                        </div>
                        <div className="text-right space-y-3">
                          <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.4em]">{isOver ? 'Over by' : 'Available'}</p>
                          <p className={cn(
                            "text-3xl font-display font-bold tracking-tight transition-colors duration-500 tabular-nums",
                            isOver ? 'text-rose-400' : 'text-brand'
                          )}>
                            {formatCurrencyShort(Math.abs(budget.amount - spent))}
                          </p>
                        </div>
                      </div>
                      <div className="relative h-3 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.05] shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                          className={cn(
                            "h-full rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-brand'
                          )}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em]">Used</p>
                        <p className={cn(
                          "text-[11px] font-bold uppercase tracking-[0.3em]",
                          isOver ? 'text-rose-400' : isWarning ? 'text-amber-500' : 'text-brand/60'
                        )}>
                          {Math.round(percentage)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Savings Goals */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-2 h-10 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
            <h3 className="text-3xl font-display font-bold text-white tracking-tight">Savings Goals</h3>
          </div>
          <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.4em]">Your Goals</p>
        </div>

        {goalsLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 text-brand animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-48 bg-white/[0.01] rounded-[64px] border border-white/[0.03] shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="w-28 h-28 rounded-[40px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-10 shadow-2xl">
                <Target className="w-12 h-12 text-white/35" />
              </div>
              <h4 className="text-3xl font-display font-bold text-white mb-4">No Goals Yet</h4>
              <p className="text-sm text-white/55 max-w-xs mx-auto leading-relaxed">Set a savings goal and track how close you are to reaching it.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {goals.map((goal, i) => {
              const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
              const isCompleted = percentage >= 100;

              return (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group relative overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                >
                  <div className={cn(
                    "absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000 opacity-0 group-hover:opacity-30",
                    isCompleted ? 'bg-brand/20' : 'bg-blue-500/20'
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[32px] flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/55 group-hover:bg-white/[0.05] group-hover:text-white/72 transition-all duration-700 shadow-2xl">
                          <Trophy className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-3xl tracking-tight">{goal.name}</h4>
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className={cn("w-2 h-2 rounded-full", isCompleted ? 'bg-brand shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]')} />
                            <p className="text-[11px] font-bold text-white/55 uppercase tracking-[0.3em]">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {isCompleted && (
                          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-[0.2em] border border-brand/20 shadow-2xl backdrop-blur-md">
                            <Trophy className="w-4 h-4" />
                            Goal Reached!
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal.id);
                          }}
                          className="p-4 text-white/35 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex justify-between items-end">
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.4em]">Saved So Far</p>
                          <p className="text-4xl font-display font-bold text-white tracking-tight tabular-nums">{formatCurrencyShort(goal.currentAmount)}</p>
                        </div>
                        <div className="text-right space-y-3">
                          <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.4em]">{isCompleted ? 'Goal Achieved' : 'Remaining'}</p>
                          <p className={cn(
                            "text-3xl font-display font-bold tracking-tight transition-colors duration-500 tabular-nums",
                            isCompleted ? 'text-brand' : 'text-blue-400'
                          )}>
                            {formatCurrencyShort(Math.max(0, goal.targetAmount - goal.currentAmount))}
                          </p>
                        </div>
                      </div>
                      <div className="relative h-3 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.05] shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                          className={cn(
                            "h-full rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                            isCompleted ? 'bg-brand' : 'bg-blue-500'
                          )}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-white/45 uppercase tracking-[0.3em]">Progress</p>
                        <p className={cn(
                          "text-[11px] font-bold uppercase tracking-[0.3em]",
                          isCompleted ? 'text-brand' : 'text-blue-400/60'
                        )}>
                          {Math.round(percentage)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <AddBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />
      <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
    </div>
  );
}
