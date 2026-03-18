import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { formatCurrencyCompact, formatCurrencyShort, formatDate } from "../lib/utils";
import { useAccounts, useTransactions } from '../lib/hooks/useFinanceData';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { cn } from '../lib/utils';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';

export default function NetWorth() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { user } = useAuth();

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Build monthly net worth from transactions
  const timelineData = useMemo(() => {
    if (!transactions.length) return [];

    // Sort transactions oldest first
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const earliest = new Date(sorted[0].date);
    const now = new Date();

    // Build monthly buckets
    const months: { key: string; label: string; month: number; year: number }[] = [];
    const cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    while (cur <= now) {
      months.push({
        key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`,
        label: cur.toLocaleString('default', { month: 'short', year: '2-digit' }),
        month: cur.getMonth(),
        year: cur.getFullYear(),
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Running balance by cumulating transactions
    let runningBalance = 0;
    const txByMonth: Record<string, number> = {};
    for (const tx of sorted) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      txByMonth[key] = (txByMonth[key] || 0) + (tx.type === 'transfer' ? 0 : tx.amount);
    }

    return months.map(m => {
      runningBalance += txByMonth[m.key] || 0;
      return { ...m, netWorth: runningBalance };
    });
  }, [transactions]);

  // Save a snapshot of current net worth daily
  useEffect(() => {
    if (!user || accounts.length === 0) return;
    const key = 'nw_snapshot_' + new Date().toDateString();
    if (localStorage.getItem(key)) return;
    addDoc(collection(db, 'netWorthSnapshots'), {
      userId: user.uid,
      date: new Date().toISOString(),
      balance: totalBalance,
    }).then(() => localStorage.setItem(key, '1')).catch(() => {});
  }, [user, totalBalance, accounts.length]);

  const firstValue = timelineData[0]?.netWorth ?? 0;
  const lastValue = timelineData[timelineData.length - 1]?.netWorth ?? totalBalance;
  const change = lastValue - firstValue;
  const changePct = firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : 0;
  const isPositive = change >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl">
        <p className="text-xs text-white/72 font-bold uppercase tracking-widest mb-2">{label}</p>
        <p className={cn('text-xl font-bold font-display', payload[0].value >= 0 ? 'text-brand' : 'text-rose-400')}>
          {formatCurrencyShort(payload[0].value)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="pt-8">
        <p className="text-[11px] font-bold text-white/65 uppercase tracking-[0.5em] mb-3">Net Worth Over Time</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-none">
              {formatCurrencyCompact(totalBalance)}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              {isPositive
                ? <TrendingUp className="w-5 h-5 text-brand" />
                : <TrendingDown className="w-5 h-5 text-rose-400" />}
              <span className={cn('text-sm font-bold', isPositive ? 'text-brand' : 'text-rose-400')}>
                {isPositive ? '+' : ''}{formatCurrencyShort(change)} ({changePct.toFixed(1)}%)
              </span>
              <span className="text-white/65 text-sm">all time</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] min-w-[120px]">
                <p className="text-[10px] text-white/65 uppercase tracking-widest mb-1 truncate">{acc.name}</p>
                <p className={cn('text-lg font-bold font-display', acc.balance < 0 ? 'text-rose-400' : 'text-white')}>
                  {formatCurrencyShort(acc.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-8 rounded-[40px] bg-gradient-to-br from-[#111] to-[#050505] border border-white/[0.03] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white">Net Worth Timeline</h3>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <Calendar className="w-4 h-4 text-white/65" />
            <span className="text-xs text-white/65 font-bold">All time</span>
          </div>
        </div>

        {timelineData.length < 2 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Wallet className="w-12 h-12 text-white/45 mx-auto mb-3" />
              <p className="text-white/65 text-sm">Add transactions to see your net worth timeline</p>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nwGradientNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={v => formatCurrencyCompact(v)} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={3}
                  fill={lastValue >= 0 ? 'url(#nwGradient)' : 'url(#nwGradientNeg)'} animationDuration={1500} dot={false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#050505', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      {timelineData.length > 0 && (
        <div className="rounded-[32px] bg-white/[0.01] border border-white/[0.03] overflow-hidden">
          <div className="px-8 py-5 border-b border-white/[0.03]">
            <h3 className="text-lg font-bold text-white">Monthly Breakdown</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {[...timelineData].reverse().slice(0, 12).map((row, i) => {
              const prev = timelineData[timelineData.length - 1 - i - 1];
              const delta = prev ? row.netWorth - prev.netWorth : 0;
              return (
                <motion.div key={row.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-8 py-4 hover:bg-white/[0.01] transition-colors">
                  <span className="text-sm font-bold text-white/84">{row.label}</span>
                  <div className="flex items-center gap-6">
                    {delta !== 0 && (
                      <span className={cn('text-xs font-bold', delta > 0 ? 'text-brand' : 'text-rose-400')}>
                        {delta > 0 ? '+' : ''}{formatCurrencyShort(delta)}
                      </span>
                    )}
                    <span className={cn('text-base font-bold font-display tabular-nums', row.netWorth < 0 ? 'text-rose-400' : 'text-white')}>
                      {formatCurrencyShort(row.netWorth)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
