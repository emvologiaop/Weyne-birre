import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, AlertCircle, ShoppingBag, Coffee, Home, Car, Loader2, PieChart, Trash2 } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useBudgets, useGoals, useCategories, useTransactions } from "../lib/hooks/useFinanceData";
import { AddBudgetModal } from "../components/modals/AddBudgetModal";
import { AddGoalModal } from "../components/modals/AddGoalModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
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

  const getCategorySpent = (categoryId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(tx => tx.categoryId === categoryId && tx.type === 'expense')
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">Budgets & Goals</h2>
          <p className="text-sm text-white/50 mt-1">Track your spending limits and savings targets</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
          >
            <Target className="w-4 h-4" />
            New Goal
          </button>
          <button 
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Monthly Budgets */}
      <div>
        <h3 className="text-lg font-medium text-white/80 mb-4">Monthly Budgets</h3>
        {budgetsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-3xl border border-white/10 shadow-xl">
            <div className="flex flex-col items-center justify-center text-white/40">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <PieChart className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-base">No budgets found.</p>
              <p className="text-sm mt-1">Create a budget to start tracking your spending.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((budget) => {
              const spent = getCategorySpent(budget.categoryId);
              const percentage = Math.min((spent / budget.amount) * 100, 100);
              const isOver = spent > budget.amount;
              const isWarning = percentage >= 85 && !isOver;

              return (
                <div key={budget.id} className="p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors opacity-10 group-hover:opacity-20 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-white/50 group-hover:bg-white/10 transition-colors shadow-lg">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white/90 text-lg">{getCategoryName(budget.categoryId)}</h4>
                          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{formatCurrency(budget.amount)} limit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isOver && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                            <AlertCircle className="w-4 h-4" />
                            Over budget
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBudget(budget.id);
                          }}
                          className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70 font-medium">{formatCurrency(spent)} spent</span>
                        <span className={isOver ? 'text-rose-400 font-medium' : 'text-white/50 font-medium'}>
                          {formatCurrency(Math.abs(budget.amount - spent))} {isOver ? 'over' : 'left'}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Savings Goals */}
      <div>
        <h3 className="text-lg font-medium text-white/80 mb-4">Savings Goals</h3>
        {goalsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-3xl border border-white/10 shadow-xl">
            <div className="flex flex-col items-center justify-center text-white/40">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-base">No goals found.</p>
              <p className="text-sm mt-1">Create a savings goal to start tracking your progress.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <div key={goal.id} className="p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors opacity-10 group-hover:opacity-20 ${percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-white/50 group-hover:bg-white/10 transition-colors shadow-lg">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white/90 text-lg">{goal.name}</h4>
                          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {percentage >= 100 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <Target className="w-4 h-4" />
                            Completed
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal.id);
                          }}
                          className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70 font-medium">{formatCurrency(goal.currentAmount)} saved</span>
                        <span className={percentage >= 100 ? 'text-emerald-400 font-medium' : 'text-white/50 font-medium'}>
                          {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))} {percentage >= 100 ? 'extra' : 'left'}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />
      <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
    </motion.div>
  );
}
