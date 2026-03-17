import React from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, CreditCard, Trophy, TrendingUp, Receipt, TrendingDown, PieChart } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, cn } from "../lib/utils";
import { motion } from "framer-motion";
import { useTransactions, useAccounts, useCategories, useSubscriptions, useAchievements } from "../lib/hooks/useFinanceData";
import { Link } from "react-router-dom";

function SummaryCard({ title, amount, icon: Icon, trend, color, trendLabel }: { title: string, amount: number, icon: any, trend?: number, color: string, trendLabel?: string }) {
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
              {trend >= 0 ? 'â†‘' : 'â†“'} {Math.abs(trend)}%
            </div>
          )}
          {trendLabel && !trend && (
             <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
               {trendLabel}
             </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-3xl font-display font-bold text-white tracking-tight">
            {formatCurrency(amount)}
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
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpenses = currentMonthTx
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('default', { month: 'short' });
  });

  const chartData = last6Months.map(month => {
    const monthTxs = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.toLocaleString('default', { month: 'short' }) === month;
    });
    
    return {
      name: month,
      income: monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
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
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.6em]">Executive Intelligence</p>
          </div>
          
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl font-display font-bold text-white tracking-tighter leading-[0.8] uppercase">
                Financial<br />
                <span className="text-brand italic serif">Architecture</span>
              </h1>
              <p className="text-lg text-white/40 font-light max-w-xl leading-relaxed tracking-tight">
                A comprehensive overview of your global capital allocation, liquidity velocity, and strategic asset distribution.
              </p>
            </div>

            <div className="flex flex-col items-start xl:items-end gap-8">
              <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Portfolio Integrity</p>
                  <div className="flex items-center gap-6">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <motion.div 
                          key={i} 
                          initial={{ height: 4 }}
                          animate={{ height: i <= 7 ? [16, 24, 16] : 4 }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                          className={cn("w-2 rounded-full transition-all duration-500", i <= 7 ? "bg-brand shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5")} 
                        />
                      ))}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-2xl font-display font-bold text-white block">OPTIMAL</span>
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">94.2% Efficiency</span>
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
              <p className="text-[11px] font-bold text-brand uppercase tracking-[0.4em]">Consolidated Net Worth</p>
              <h2 className="text-7xl md:text-8xl font-display font-bold text-white tracking-tighter tabular-nums">
                {formatCurrency(totalBalance)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400">+12.4% <span className="text-white/20 ml-1 font-normal">vs last month</span></span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-white/40" />
                <span className="text-sm font-bold text-white/60">Peak: <span className="text-white ml-1">{formatCurrency(totalBalance * 1.05)}</span></span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="p-10 rounded-[48px] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/[0.05] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.3em]">Liquidity Index</h4>
                  <CreditCard className="w-5 h-5 text-white/20" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-display font-bold text-white">78.5</span>
                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">High Liquidity</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "78.5%" }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>
                <p className="text-xs text-white/30 leading-relaxed">
                  Your current cash-to-asset ratio allows for immediate strategic deployment into emerging market opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <SummaryCard 
          title="Consolidated Assets" 
          amount={totalBalance} 
          icon={Wallet} 
          trend={12.5}
          color="bg-emerald-500"
        />
        <SummaryCard 
          title="Monthly Inflow" 
          amount={monthlyIncome} 
          icon={TrendingUp} 
          trend={8.2}
          color="bg-blue-500"
        />
        <SummaryCard 
          title="Monthly Outflow" 
          amount={monthlyExpenses} 
          icon={TrendingDown} 
          trend={-3.1}
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
                <h3 className="text-3xl font-display font-bold text-white tracking-tight">Capital Velocity</h3>
                <p className="text-[11px] text-white/20 mt-2 uppercase tracking-[0.4em] font-bold">6-Month Strategic Analysis</p>
              </div>
              <div className="flex gap-8 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Inflow</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Outflow</span>
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
              <h3 className="text-3xl font-display font-bold text-white tracking-tight">Sector Allocation</h3>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-white/5 transition-colors">
                <PieChart className="w-6 h-6 text-white/30" />
              </div>
            </div>
          <div className="space-y-8">
            {categories.slice(0, 5).map((cat, i) => {
              const amount = transactions
                .filter(tx => tx.categoryId === cat.id && tx.type === 'expense')
                .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
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
            })}
          </div>
          
          <div className="mt-12 p-8 rounded-3xl bg-white/[0.01] border border-white/[0.03] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em] mb-3">Strategic Insight</p>
              <p className="text-xs text-white/40 leading-relaxed italic">
                "Your expenditure in the <span className="text-white/60 font-bold">Lifestyle</span> sector has decreased by 14% this quarter, significantly improving your net savings velocity."
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
              <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Latest Ledger Entries</p>
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
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
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
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Upcoming Obligations</h3>
                <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Subscription Management</p>
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
                      <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] mt-1.5">Due in {Math.ceil((new Date(sub.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</p>
                    </div>
                  </div>
                  <p className="text-base font-mono font-bold text-white/60 group-hover:text-white transition-all duration-500 tracking-tight">{formatCurrency(sub.amount)}</p>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl">
                  <p className="text-xs text-white/10 font-bold uppercase tracking-[0.2em]">No Obligations Detected</p>
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
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.3em] font-bold">Financial Achievements</p>
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
                  <p className="text-xs text-white/10 font-bold uppercase tracking-[0.2em] italic py-4">Begin your journey to earn recognition</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
