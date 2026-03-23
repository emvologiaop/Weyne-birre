import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, X, Receipt, Check, AlertCircle } from 'lucide-react';
import { processReceipt } from '../../lib/receiptService';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { toast } from 'sonner';
import { useAccounts, useCategories } from '../../lib/hooks/useFinanceData';

interface AddReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddReceiptModal({ isOpen, onClose }: AddReceiptModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<any | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const handleReset = () => {
    setScannedData(null);
    setSelectedAccountId('');
    setSelectedCategoryId('');
    setLoading(false);
  };

  const closeModal = () => {
    handleReset();
    onClose();
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setLoading(true);
    try {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = (reader.result as string).split(',')[1];
        const receiptData = await processReceipt(base64Image, file.type);
        setScannedData({ ...receiptData, fileUrl: URL.createObjectURL(file) });
        
        // Try to auto-match category
        if (receiptData.category) {
          const matchedCategory = categories.find(c => 
            c.name.toLowerCase().includes(receiptData.category?.toLowerCase() || '') && c.type === 'expense'
          );
          if (matchedCategory) setSelectedCategoryId(matchedCategory.id);
        }
        
        // Auto-select first checking/savings account if available
        if (accounts.length > 0) {
          const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
          setSelectedAccountId(defaultAcc.id);
        }
        
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process receipt');
      setLoading(false);
    }
  };

  const handleSaveBoth = async () => {
    if (!user || !scannedData || !selectedAccountId) {
      toast.error('Account must be selected to save transaction.');
      return;
    }
    
    // Default to uncategorized if none matched/selected
    let finalCategoryId = selectedCategoryId;
    if (!finalCategoryId) {
      const fallbackCat = categories.find(c => c.name.toLowerCase() === 'other' || c.name.toLowerCase() === 'miscellaneous');
      finalCategoryId = fallbackCat?.id || categories[0]?.id || 'misc';
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create Receipt Doc
        const newReceiptRef = doc(collection(db, 'receipts'));
        transaction.set(newReceiptRef, {
          userId: user.uid,
          merchant: scannedData.merchant || 'Unknown Merchant',
          amount: parseFloat(scannedData.amount) || 0,
          date: scannedData.date || new Date().toISOString(),
          category: scannedData.category || 'Other',
          imageUrl: scannedData.fileUrl,
          rawText: ''
        });

        // 2. Create Expense Transaction
        const newTxRef = doc(collection(db, 'transactions'));
        const amountNum = parseFloat(scannedData.amount) || 0;
        transaction.set(newTxRef, {
          userId: user.uid,
          accountId: selectedAccountId,
          categoryId: finalCategoryId,
          amount: -Math.abs(amountNum), // Negative because it's an expense receipt
          date: scannedData.date ? new Date(scannedData.date).toISOString() : new Date().toISOString(),
          description: scannedData.merchant || 'Receipt Scan',
          type: 'expense',
          status: 'cleared',
          tags: ['receipt']
        });

        // 3. Update Account Balance
        const accountRef = doc(db, 'accounts', selectedAccountId);
        const acc = accounts.find(a => a.id === selectedAccountId);
        if (acc) {
          transaction.update(accountRef, {
            balance: acc.balance - Math.abs(amountNum)
          });
        }
      });

      toast.success('Saved receipt & transaction!');
      closeModal();
    } catch (err) {
      console.error('Error saving transaction: ', err);
      toast.error('Failed to save receipt & transaction.');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">Scan Receipt</h2>
            <p className="text-xs text-white/55 mt-1 font-medium">Extract data and create transaction instantly</p>
          </div>
          <button onClick={closeModal} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/78 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!scannedData ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-[24px] p-10 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-brand bg-brand/10 scale-[1.02]' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-brand animate-bounce' : 'text-white/45'}`} />
            </div>
            <p className="text-sm font-bold text-white">Upload receipt image</p>
            <p className="text-xs text-white/55 mt-2">Drag & drop or click to browse</p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 rounded-2xl bg-white/5 border border-brand/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Data Extracted Successfully</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/55 font-bold mb-1">Merchant</p>
                  <input type="text" value={scannedData.merchant} onChange={e => setScannedData({...scannedData, merchant: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/55 font-bold mb-1">Amount</p>
                  <input type="number" value={scannedData.amount} onChange={e => setScannedData({...scannedData, amount: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/55 font-bold mb-1">Charge To Account</p>
                  <select 
                    value={selectedAccountId} 
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                  >
                    <option value="" disabled>Select account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (ETB {acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/55 font-bold mb-1">Assign Category</p>
                  <select 
                    value={selectedCategoryId} 
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                  >
                    <option value="" disabled>Select category...</option>
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleReset}
                className="flex-1 py-4 text-sm font-bold text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
                disabled={loading}
              >
                Scan Another
              </button>
              <button 
                onClick={handleSaveBoth}
                className="flex-[2] py-4 text-sm font-bold text-black bg-brand hover:bg-brand-dark rounded-2xl transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
                disabled={loading || !selectedAccountId}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                Save as Transaction
              </button>
            </div>
          </div>
        )}

        {loading && !scannedData && (
          <div className="absolute inset-0 z-20 bg-[#141414]/80 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-brand/10 border-2 border-brand/30 rounded-2xl flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
            <p className="font-bold text-white tracking-wide">AI is reading receipt...</p>
            <p className="text-xs text-brand/80 mt-2 font-medium">Extracting merchant & amount</p>
          </div>
        )}
      </div>
    </div>
  );
}
