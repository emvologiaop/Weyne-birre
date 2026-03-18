import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Sparkles, Loader2, Calendar, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useTransactions, useAccounts, useBudgets, useCategories } from '../lib/hooks/useFinanceData';
import { formatCurrencyCompact, formatCurrencyShort, formatDate } from "../lib/utils";
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });


type ReportPeriod = 'week' | 'month' | 'year';

function getPeriodRange(period: ReportPeriod): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { start, end, label: 'This Week' };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, label: now.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end, label: `Year ${now.getFullYear()}` };
}

function exportCSV(transactions: any[], categories: any[], accounts: any[], period: string) {
  const header = 'Date,Description,Type,Category,Account,Amount (ETB)\n';
  const rows = transactions.map(tx => {
    const cat = categories.find(c => c.id === tx.categoryId)?.name ?? 'Uncategorized';
    const acc = accounts.find(a => a.id === tx.accountId)?.name ?? 'Unknown';
    return `"${formatDate(tx.date)}","${tx.description}","${tx.type}","${cat}","${acc}","${tx.amount}"`;
  }).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `weyne-birre-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click(); URL.revokeObjectURL(url);
}

function exportTextReport(content: string, period: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `weyne-birre-ai-report-${period}-${new Date().toISOString().split('T')[0]}.txt`;
  link.click(); URL.revokeObjectURL(url);
}

export default function Reports() {
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();
  const { categories } = useCategories();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [aiReport, setAiReport] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const { start, end, label } = getPeriodRange(period);

  const periodTx = useMemo(() =>
    transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= start && d <= end && tx.type !== 'transfer';
    }), [transactions, start, end]);

  const income = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const expenses = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expenses;
  const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : '0';

  // Top categories
  const catSpend = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([id, amount]) => ({ name: categories.find(c => c.id === id)?.name ?? 'Other', amount, color: categories.find(c => c.id === id)?.color ?? '#94a3b8' }))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [periodTx, categories]);

  const generateAIReport = async () => {
    setLoadingAI(true);
    setAiReport('');
    try {
      const context = {
        period: label,
        totalIncome: income,
        totalExpenses: expenses,
        netSavings: net,
        savingsRate: `${savingsRate}%`,
        totalBalance: accounts.reduce((s, a) => s + (a.balance || 0), 0),
        topExpenseCategories: catSpend.map(c => `${c.name}: ETB ${c.amount.toLocaleString()}`),
        transactionCount: periodTx.length,
        budgetsCount: budgets.length,
      };
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: `You are a friendly personal finance advisor for 'ወይኔ ብሬ', an Ethiopian personal finance app. 
          All amounts are in Ethiopian Birr (ETB). Generate a clear, practical, encouraging financial report in plain English. 
          Use Markdown formatting. Include: 1) Executive summary (2-3 sentences), 2) Key highlights (what went well), 
          3) Areas to improve, 4) Specific actionable tips for next period. Keep it under 400 words.`,
        },
        contents: [{ role: 'user', parts: [{ text: `Generate a financial report for: ${JSON.stringify(context, null, 2)}` }] }],
      });
      setAiReport(response.text ?? '');
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('AI report error:', msg);
      setAiReport(`Could not generate report: ${msg}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const stats = [
    { label: 'Money In', value: income, icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Money Out', value: expenses, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Net Savings', value: net, icon: PieChart, color: net >= 0 ? 'text-brand' : 'text-rose-400', bg: net >= 0 ? 'bg-brand/10' : 'bg-rose-400/10' },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold text-white/65 uppercase tracking-[0.5em] mb-3">Reports & Export</p>
          <h1 className="text-5xl font-display font-bold text-white tracking-tighter">Financial Reports</h1>
          <p className="text-white/72 mt-2">Get AI-powered insights and export your data.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
          {(['week', 'month', 'year'] as ReportPeriod[]).map(p => (
            <button key={p} onClick={() => { setPeriod(p); setAiReport(''); }}
              className={cn('px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all',
                period === p ? 'bg-brand text-black' : 'text-white/78 hover:text-white')}>
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Period label */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-brand" />
        <span className="text-sm font-bold text-white/84">{label}</span>
        <span className="text-white/55">·</span>
        <span className="text-sm text-white/65">{periodTx.length} transactions</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] transition-colors">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-white/65 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={cn('text-3xl font-display font-bold tabular-nums', stat.color)}>{formatCurrencyCompact(Math.abs(stat.value))}</p>
          </motion.div>
        ))}
      </div>

      {/* Savings rate */}
      <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white/72">Savings Rate</p>
          <p className={cn('text-4xl font-display font-bold mt-1', parseFloat(savingsRate) >= 20 ? 'text-brand' : parseFloat(savingsRate) >= 0 ? 'text-amber-400' : 'text-rose-400')}>
            {savingsRate}%
          </p>
        </div>
        <div className="w-40 bg-white/5 rounded-full h-3 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-1000', parseFloat(savingsRate) >= 20 ? 'bg-brand' : parseFloat(savingsRate) >= 0 ? 'bg-amber-400' : 'bg-rose-400')}
            style={{ width: `${Math.min(100, Math.max(0, parseFloat(savingsRate)))}%` }} />
        </div>
      </div>

      {/* Top categories */}
      {catSpend.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
          <h3 className="text-base font-bold text-white mb-5">Top Spending Categories</h3>
          <div className="space-y-4">
            {catSpend.map(cat => (
              <div key={cat.name} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-white/84 flex-1">{cat.name}</span>
                <span className="text-sm font-bold text-white tabular-nums">{formatCurrencyShort(cat.amount)}</span>
                <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(cat.amount / expenses) * 100}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => exportCSV(periodTx, categories, accounts, period)}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-brand/20 transition-all group">
          <Download className="w-5 h-5 text-white/72 group-hover:text-brand transition-colors" />
          <div className="text-left">
            <p className="text-sm font-bold text-white">Export CSV</p>
            <p className="text-xs text-white/65">Download as spreadsheet</p>
          </div>
        </button>
        <button onClick={generateAIReport} disabled={loadingAI}
          className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-brand/10 border border-brand/20 hover:bg-brand/15 transition-all group disabled:opacity-50">
          {loadingAI ? <Loader2 className="w-5 h-5 text-brand animate-spin" /> : <Sparkles className="w-5 h-5 text-brand" />}
          <div className="text-left">
            <p className="text-sm font-bold text-white">Generate AI Report</p>
            <p className="text-xs text-white/65">Personalised insights + export</p>
          </div>
        </button>
      </div>

      {/* AI Report */}
      {(loadingAI || aiReport) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[32px] bg-white/[0.01] border border-brand/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-bold text-white">AI Report — {label}</h3>
            </div>
            {aiReport && (
              <button onClick={() => exportTextReport(aiReport, period)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/84 hover:text-white text-sm transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            )}
          </div>
          {loadingAI ? (
            <div className="flex items-center gap-3 text-white/72">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
              <span className="text-sm">Generating your personalised report...</span>
            </div>
          ) : (
            <div className="markdown-body prose prose-invert prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{aiReport}</Markdown>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
