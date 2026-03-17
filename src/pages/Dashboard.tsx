import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, PieChart as PieChartIcon, CreditCard, Trophy, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { formatCurrency } from "../lib/utils";
import { motion } from "framer-motion";
import { useTransactions, useAccounts, useCategories, useSubscriptions, useAchievements } from "../lib/hooks/useFinanceData";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { transactions, loading: txLoading } = useTransactions();
  const { accounts, loading: accLoading } = useAccounts();
  const { categories, loading: catLoading } = useCategories();
  const { subscriptions, loading: subLoading } = useSubscriptions();
  const { achievements, loading: achLoading } = useAchievements();

  const loading = txLoading || accLoading || catLoading || subLoading || achLoading;

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Calculate monthly income/expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpenses = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Prepare Pie Chart Data
  const expensesByCategory = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const name = cat ? cat.name : 'Other';
      acc[name] = (acc[name] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory)
    .map(([name, value], index) => ({
      name,
      value: value as number,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare Area Chart Data (Last 6 months)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      name: d.toLocaleString('default', { month: 'short' }),
      balance: 0 // We'll calculate this
    };
  });

  // Calculate historical balances (simplified approximation based on current balance and transactions)
  let runningBalance = totalBalance;
  
  // Go backwards from current to 6 months ago
  const chartData = [...last6Months].reverse().map(period => {
    const periodTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === period.month && d.getFullYear() === period.year;
    });
    
    const netChange = periodTx.reduce((sum, tx) => sum + tx.amount, 0);
    const currentPeriodBalance = runningBalance;
    runningBalance -= netChange; // Subtract net change to get previous month's balance
    
    return {
      ...period,
      balance: currentPeriodBalance
    };
  }).reverse();

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
      className="space-y-8"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Balance"
          amount={totalBalance}
          trend="Current"
          isPositive={totalBalance >= 0}
          icon={<Wallet className="w-5 h-5" />}
        />
        <SummaryCard
          title="Monthly Income"
          amount={monthlyIncome}
          trend="This Month"
          isPositive={true}
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-400" />}
        />
        <SummaryCard
          title="Monthly Expenses"
          amount={monthlyExpenses}
          trend="This Month"
          isPositive={false}
          icon={<ArrowDownRight className="w-5 h-5 text-rose-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Trend */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-white/10 lg:col-span-2">
          <h2 className="text-lg font-medium text-white/90">Net Worth Trend</h2>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#ffffff20', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="balance" stroke="#10B981" fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
          <h2 className="text-lg font-medium text-white/90">Asset Allocation</h2>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accounts.map(a => ({ name: a.name, balance: a.balance }))}>
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#ffffff20', borderRadius: '12px' }} />
                <Bar dataKey="balance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriptions */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
          <h2 className="text-lg font-medium text-white/90 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Upcoming Subscriptions
          </h2>
          <div className="mt-4 space-y-3">
            {subscriptions.map(sub => (
              <div key={sub.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/70">{sub.name}</span>
                <span className="text-white font-medium">{formatCurrency(sub.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-white/10">
          <h2 className="text-lg font-medium text-white/90 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Recent Achievements
          </h2>
          <div className="mt-4 space-y-3">
            {achievements.map(ach => (
              <div key={ach.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-white/70">{ach.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({ title, amount, trend, isPositive, icon }: { title: string, amount: number, trend: string, isPositive: boolean, icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 flex flex-col gap-4 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors opacity-10 group-hover:opacity-20 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      
      <div className="relative z-10 flex items-center justify-between text-white/50 group-hover:text-white/70 transition-colors">
        <span className="text-sm font-medium uppercase tracking-wider">{title}</span>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-light text-white mb-1 font-mono">{formatCurrency(amount)}</div>
        <div className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}
