import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Check, X, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { useAccounts, useCategories } from '../lib/hooks/useFinanceData';
import { toast } from 'sonner';
import { formatCurrencyShort } from "../lib/utils";
import { cn } from '../lib/utils';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  selected: boolean;
  categoryId: string;
  accountId: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Try to detect header row
  const header = lines[0].toLowerCase();
  const hasHeader = /date|amount|description|debit|credit/.test(header);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: ParsedRow[] = [];
  for (const line of dataLines) {
    // Handle quoted CSV
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) ?? line.split(',').map(c => c.trim());
    if (cols.length < 2) continue;

    // Try multiple column orderings: date, description, amount OR date, amount, description
    let date = '', description = '', amount = 0;

    // Detect date column
    for (let i = 0; i < Math.min(cols.length, 3); i++) {
      if (/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/.test(cols[i])) {
        date = cols[i];
        break;
      }
    }

    // Detect amount column (numeric, possibly with commas or parentheses for negatives)
    for (const col of cols) {
      const cleaned = col.replace(/,/g, '').replace(/[()]/g, match => match === '(' ? '-' : '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && Math.abs(num) > 0 && col !== date) {
        amount = num;
        break;
      }
    }

    // Description = remaining non-date, non-amount column
    for (const col of cols) {
      if (col !== date && isNaN(parseFloat(col.replace(/,/g, '')))) {
        description = col;
        break;
      }
    }

    if (!date || amount === 0) continue;

    // Normalize date
    let parsedDate: Date;
    try {
      parsedDate = new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
      if (isNaN(parsedDate.getTime())) continue;
    } catch { continue; }

    rows.push({
      date: parsedDate.toISOString().split('T')[0],
      description: description || 'Bank transaction',
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      selected: true,
      categoryId: '',
      accountId: '',
    });
  }
  return rows;
}

export default function BankImport() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const [importing, setImporting] = useState(false);
  const [defaultAccountId, setDefaultAccountId] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('Could not parse any transactions. Make sure your CSV has date, description, and amount columns.');
        return;
      }
      setRows(parsed.map(r => ({ ...r, accountId: defaultAccountId })));
      setStep('review');
    };
    reader.readAsText(file);
  }, [defaultAccountId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    multiple: false,
  });

  const selectedRows = rows.filter(r => r.selected);

  const handleImport = async () => {
    if (!user) return;
    if (selectedRows.some(r => !r.accountId)) {
      setError('Please select an account for all transactions.');
      return;
    }
    setImporting(true);
    setError('');
    try {
      for (const row of selectedRows) {
        const finalAmount = row.type === 'expense' ? -Math.abs(row.amount) : Math.abs(row.amount);
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          accountId: row.accountId,
          categoryId: row.categoryId || 'uncategorized',
          amount: finalAmount,
          date: new Date(row.date).toISOString(),
          description: row.description,
          type: row.type,
          status: 'cleared',
          tags: ['imported'],
          isRecurring: false,
          importedAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, 'accounts', row.accountId), { balance: increment(finalAmount) });
      }
      toast.success(`Imported ${selectedRows.length} transactions successfully!`);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <div className="pt-8">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.5em] mb-3">Bank Statement Import</p>
        <h1 className="text-5xl font-display font-bold text-white tracking-tighter">Import Transactions</h1>
        <p className="text-white/40 mt-2">Upload a CSV export from your bank to import transactions automatically.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        {['Upload', 'Review', 'Done'].map((s, i) => {
          const stepKey = ['upload', 'review', 'done'][i];
          const active = step === stepKey;
          const done = ['upload', 'review', 'done'].indexOf(step) > i;
          return (
            <React.Fragment key={s}>
              <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                active ? 'bg-brand text-black' : done ? 'bg-brand/20 text-brand' : 'bg-white/5 text-white/30')}>
                {done ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < 2 && <ArrowRight className="w-4 h-4 text-white/20" />}
            </React.Fragment>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Default Account</label>
              <select value={defaultAccountId} onChange={e => setDefaultAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand/50 transition-colors appearance-none">
                <option value="">Select account (optional)</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          </div>

          <div {...getRootProps()} className={cn(
            'border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300',
            isDragActive ? 'border-brand bg-brand/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
          )}>
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Drop your CSV here</h3>
            <p className="text-white/30 text-sm">or click to browse</p>
            <p className="text-white/20 text-xs mt-4">Supports CSV files from most Ethiopian and international banks</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <h4 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Expected CSV format</h4>
            <code className="text-xs text-white/40 font-mono block">
              Date, Description, Amount<br />
              2024-01-15, Supermarket, -250.00<br />
              2024-01-16, Salary, 15000.00
            </code>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{rows.length} transactions found</h3>
              <p className="text-white/30 text-sm">{selectedRows.length} selected for import</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRows(r => r.map(x => ({ ...x, selected: true })))}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm hover:text-white transition-colors">Select All</button>
              <button onClick={() => setRows(r => r.map(x => ({ ...x, selected: false })))}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-sm hover:text-white transition-colors">None</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.03]">
            {rows.map((row, i) => (
              <div key={i} className={cn('p-4 flex items-center gap-4 transition-colors', row.selected ? '' : 'opacity-40')}>
                <input type="checkbox" checked={row.selected}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, selected: e.target.checked } : x))}
                  className="w-4 h-4 accent-brand rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{row.description}</p>
                  <p className="text-xs text-white/30">{row.date}</p>
                </div>
                <span className={cn('text-sm font-bold tabular-nums', row.type === 'income' ? 'text-brand' : 'text-white/70')}>
                  {row.type === 'income' ? '+' : '-'}{formatCurrencyShort(row.amount)}
                </span>
                <select value={row.accountId}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, accountId: e.target.value } : x))}
                  className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-brand/50 appearance-none">
                  <option value="">Account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
                <select value={row.categoryId}
                  onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, categoryId: e.target.value } : x))}
                  className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-brand/50 appearance-none">
                  <option value="">Category</option>
                  {categories.filter(c => c.type === row.type).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={() => { setRows([]); setStep('upload'); }} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:text-white transition-colors">
              Back
            </button>
            <button onClick={handleImport} disabled={importing || selectedRows.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand/90 transition-colors disabled:opacity-50">
              {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Import ${selectedRows.length} transactions`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 rounded-3xl bg-white/[0.01] border border-white/[0.03]">
          <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-brand" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Import Complete!</h3>
          <p className="text-white/40 mb-8">{selectedRows.length} transactions imported successfully.</p>
          <button onClick={() => { setRows([]); setStep('upload'); setError(''); }}
            className="px-8 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand/90 transition-colors">
            Import More
          </button>
        </motion.div>
      )}
    </div>
  );
}
