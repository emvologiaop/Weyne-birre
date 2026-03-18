import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, CreditCard, Trophy, TrendingUp, Receipt, TrendingDown, PieChart } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn, formatCurrency, formatCurrencyShort } from "../lib/utils";
import { motion } from "framer-motion";
import { useTransactions, useAccounts, useCategories, useSubscriptions, useAchievements } from "../lib/hooks/useFinanceData";
import { Link } from "react-router-dom";

function SummaryCard({ title, amount, icon: Icon, trend, color, trendLabel }: { title: string, amount: number, icon: any, trend?: number | null, color: string, trendLabel?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="p-8 rounded-[32px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.03] hover:border-white/10 transition-all duration-500 group relative overflow-hidden shadow-2xl"
    >
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 ${color}`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all duration-500 shadow-lg">
            <Icon className="w-7 h-7" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border",
              trend >= 0 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
          {trendLabel && (trend === undefined || trend === null) && (
             <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
               {trendLabel}
             </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-3xl font-display font-bold text-white tracking-tight">
            {formatCurrencyShort(amount)}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { transactions, loading: txLoading } = useTransactions();
  const { accounts, loading: accLoading } = useAccounts();
  const { categories, loading: catLoading } = useCategories();
  const { subscriptions, loading: subLoading } = useSubscriptions();
  const { achievements, loading: achLoading } = useAchievements();

  const loading = txLoading || accLoading || catLoading || subLoading || achLoading;

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const monthlyExpenses = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const prevMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });

  const prevMonthlyIncome = prevMonthTx
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const prevMonthlyExpenses = prevMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Only compute trend when there IS previous data; null = no prev data
  const incomeTrend = prevMonthlyIncome === 0 ? null : Math.round(((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100);
  const expenseTrend = prevMonthlyExpenses === 0 ? null : Math.round(((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100);
  
  // Calculate a mock efficiency based on budget adherence if budgets existed, 
  // but for now let's use a ratio of income to expenses
  const efficiency = monthlyIncome > 0 ? Math.max(0, Math.min(Math.round((1 - (monthlyExpenses / monthlyIncome)) * 100), 100)) : 0;
  // Score 0-100: ratio of income to expenses. 0 = no income or all spent, 100 = saving a lot.
  const liquidityIndex = (monthlyIncome === 0 && monthlyExpenses === 0)
    ? 0
    : monthlyIncome === 0
      ? 0  // spending with no income = worst score
      : Math.min(100, Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)));
  const activeBars = Math.round((efficiency / 100) * 8);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
  });

  const chartData = last6Months.map(({ label, month, year }) => {
    const monthTxs = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    
    return {
      name: label,
      income: monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      expenses: monthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-32">
      {/* Editorial Header */}
      <div className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[160px] opacity-40 animate-pulse" />
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] opacity-40" />
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-[1px] bg-white/10" />
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.6em]">Your Money Overview</p>
          </div>
          
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl font-display font-bold text-white tracking-tighter leading-[0.8] uppercase">
                Your<br />
                <span className="text-brand italic serif">Dashboard</span>
              </h1>
              <p className="text-lg text-white/40 font-light max-w-xl leading-relaxed tracking-tight">
                See all your money in one place — what you have, spend, and earn.
              </p>
            </div>

            <div className="flex flex-col items-start xl:items-end gap-8">
              <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Your Finances</p>
                  <div className="flex items-center gap-6">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <motion.div 
                          key={i} 
                          initial={{ height: 4 }}
                          animate={{ height: i <= activeBars ? [16, 24, 16] : 4 }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                          className={cn("w-2 rounded-full transition-all duration-500", i <= activeBars ? "bg-brand shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5")} 
                        />
                      ))}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xl font-display font-bold text-white block">
                        {efficiency > 80 ? 'OPTIMAL' : efficiency > 50 ? 'STABLE' : 'CRITICAL'}
                      </span>
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{efficiency}% Efficiency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Display */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[64px] -m-8 pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-brand uppercase tracking-[0.4em]">Total Balance</p>
              <h2 className="text-7xl md:text-8xl font-display font-bold text-white tracking-tighter tabular-nums">
                {formatCurrencyShort(totalBalance)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {incomeTrend !== null && (
                <div className={cn(
                  "px-6 py-3 rounded-2xl border flex items-center gap-3",
                  incomeTrend >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}>
                  {incomeTrend >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
                  <span className={cn("text-sm font-bold", incomeTrend >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {incomeTrend >= 0 ? '+' : ''}{incomeTrend}% <span className="text-white/20 ml-1 font-normal">vs last month</span>
                  </span>
                </div>
              )}
              <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-white/40" />
                <span className="text-sm font-bold text-white/60">Net this month: <span className="text-white ml-1">{formatCurrencyShort(monthlyIncome - monthlyExpenses)}</span></span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="p-10 rounded-[48px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em]">Spending Health</h4>
                  <CreditCard className="w-5 h-5 text-white/20" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-display font-bold text-white">{liquidityIndex}</span>
                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">
                      {liquidityIndex > 70 ? 'Healthy' : liquidityIndex > 40 ? 'Moderate' : 'Watch Out'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${liquidityIndex}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>
                <p className="text-xs text-white/30 leading-relaxed">
                  {liquidityIndex > 70 ? 'Your spending looks healthy. Keep it up!' : liquidityIndex > 40 ? 'Watch your spending — it is getting close to your income.' : liquidityIndex === 0 ? 'Add transactions to see your spending health.' : 'You are spending more than you earn. Try to cut back.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <SummaryCard 
          title="Total Balance" 
          amount={totalBalance} 
          icon={Wallet} 
          trend={undefined}
          color="bg-emerald-500"
        />
        <SummaryCard 
          title="Money In This Month" 
          amount={monthlyIncome} 
          icon={TrendingUp} 
          trend={incomeTrend}
          color="bg-blue-500"
        />
        <SummaryCard 
          title="Money Out This Month" 
          amount={monthlyExpenses} 
          icon={TrendingDown} 
          trend={expenseTrend}
          color="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[140px] -mr-64 -mt-64 transition-all duration-1000 group-hover:bg-brand/10" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16">
              <div>
                <h3 className="text-3xl font-display font-bold text-white tracking-tight">Monthly Overview</h3>
                <p className="text-[11px] text-white/20 mt-2 uppercase tracking-[0.4em] font-bold">Last 6 Months</p>
              </div>
              <div className="flex gap-8 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Money In</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Money Out</span>
                </div>
              </div>
            </div>
            
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#ffffff15', fontSize: 10, fontWeight: 700 }}
                    dy={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#ffffff15', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(value) => `${value > 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0a', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '24px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      fontSize: '11px',
                      padding: '16px'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth={2}
                    fill="transparent" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-12 rounded-[56px] bg-gradient-to-br from-[#111111] to-[#050505] border border-white/[0.03] shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-3xl font-display font-bold text-white tracking-tight">Spending by Category</h3>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/5 transition-colors">
                <PieChart className="w-6 h-6 text-white/30" />
              </div>
            </div>
          <div className="space-y-8">
            {monthlyExpenses > 0 ? (
              [...categories]
                .map(cat => ({
                  ...cat,
                  amount: currentMonthTx
                    .filter(tx => tx.categoryId === cat.id && tx.type === 'expense')
                    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                }))
                .filter(cat => cat.amount > 0)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((cat, i) => {
                const amount = cat.amount;
                const total = monthlyExpenses || 1;
                const percentage = Math.round((amount / total) * 100);
                
                return (
                  <div key={cat.id} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-bold text-white/40 group-hover:text-white transition-all duration-500 tracking-tight">{cat.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white/10 tracking-[0.2em] uppercase">{percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.01] rounded-full overflow-hidden border border-white/[0.03]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-xs text-white/10 font-bold uppercase tracking-[0.2em]">No Data Yet</p>
              </div>
            )}
          </div>
          
          <div className="mt-12 p-8 rounded-3xl bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mb-3">Tip</p>
              <p className="text-xs text-white/40 leading-relaxed italic">
                {transactions.length > 0 
                  ? `Your spending is ${efficiency > 70 ? 'under control' : 'a bit high this month'}. Keep tracking to reach your goals.`
                  : 'Add your first transaction to see tips here.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Transactions */}
        <div className="p-10 rounded-[48px] bg-gradient-to-br from-[#0f0f0f] to-[#050505] border border-white/[0.03] shadow-[0_30px_60px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-display font-bold text-white tracking-tight">Recent Activity</h3>
              <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Recent Transactions</p>
            </div>
            <Link to="/transactions" className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] hover:bg-white/[0.05] hover:text-white transition-all duration-500">View All</Link>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-5 rounded-3xl hover:bg-white/[0.01] transition-all group border border-transparent hover:border-white/[0.03]">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-700 shadow-2xl border border-white/[0.05]",
                    tx.type === 'income' ? "bg-brand/10 text-brand" : "bg-white/[0.02] text-white/20 group-hover:bg-white/[0.05] group-hover:text-white/40"
                  )}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/80 group-hover:text-white transition-all duration-500">{tx.description}</p>
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] mt-1.5">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "text-base font-mono font-bold tracking-tight",
                  tx.type === 'income' ? "text-brand" : "text-white/60 group-hover:text-white/90 transition-all duration-500"
                )}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrencyShort(Math.abs(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions & Achievements */}
        <div className="space-y-12">
          <div className="p-10 rounded-[48px] bg-gradient-to-br from-[#0f0f0f] to-[#050505] border border-white/[0.03] shadow-[0_30px_60px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Upcoming Charges</h3>
                <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Subscriptions</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white/20" />
              </div>
            </div>
            <div className="space-y-5">
              {subscriptions.slice(0, 3).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 transition-all duration-700 group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[18px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/10 group-hover:text-white/40 group-hover:bg-white/[0.05] transition-all duration-700">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/80 group-hover:text-white transition-all duration-500">{sub.name}</p>
                      <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] mt-1.5">{(() => {
  const start = new Date(sub.startDate);
  const origDay = start.getDate();
  const now = new Date(); now.setHours(0,0,0,0);
  let s = new Date(start);
  while(s <= now) {
    if(sub.frequency === 'yearly') { s.setFullYear(s.getFullYear()+1); }
    else if(sub.frequency === 'weekly') { s.setDate(s.getDate()+7); }
    else { s.setMonth(s.getMonth()+1); }
    const maxD = new Date(s.getFullYear(), s.getMonth()+1, 0).getDate();
    s.setDate(Math.min(origDay, maxD));
  }
  const days = Math.ceil((s.getTime() - now.getTime())/(1000*60*60*24));
  return days <= 0 ? 'Due today' : `Due in ${days} day${days===1?'':'s'}`;
})()}</p>
                    </div>
                  </div>
                  <p className="text-base font-mono font-bold text-white/60 group-hover:text-white transition-all duration-500 tracking-tight">{formatCurrencyShort(sub.amount)}</p>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl">
                  <p className="text-xs text-white/10 font-bold uppercase tracking-[0.2em]">No subscriptions yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-10 rounded-[48px] bg-gradient-to-br from-brand/5 to-blue-600/5 border border-white/[0.03] shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">Milestones</h3>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Achievements</p>
                </div>
                <Trophy className="w-8 h-8 text-brand/40 group-hover:text-brand transition-colors duration-700" />
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {achievements.slice(0, 4).map((ach, i) => (
                  <motion.div 
                    key={ach.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="shrink-0 w-16 h-16 rounded-[24px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-3xl shadow-2xl hover:scale-110 hover:bg-white/[0.05] transition-all duration-500 cursor-pointer relative group/ach"
                    title={ach.name}
                  >
                    <div className="absolute inset-0 bg-brand/10 rounded-[24px] opacity-0 group-hover/ach:opacity-100 transition-opacity duration-500 blur-xl" />
                    <span className="relative z-10">{ach.icon}</span>
                  </motion.div>
                ))}
                {achievements.length === 0 && (
                  <p className="text-xs text-white/10 font-bold uppercase tracking-[0.2em] italic py-4">Complete goals to earn badges</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
