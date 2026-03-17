import { useState } from "react";
import { Wallet, Plus, Loader2, Trash2 } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useAccounts } from "../lib/hooks/useFinanceData";
import { AddAccountModal } from "../components/modals/AddAccountModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function Accounts() {
  const { accounts, loading } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'accounts', id));
      toast.success('Account deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'accounts');
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white/90">Your Accounts</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] rounded-3xl border border-white/10 shadow-xl">
          <div className="flex flex-col items-center justify-center text-white/40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-base">No accounts found.</p>
            <p className="text-sm mt-1">Add your first account to start tracking your balance.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white/90 text-lg">{account.name}</h3>
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{account.institution || account.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(account.id);
                    }}
                    className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <p className="text-sm text-white/50 mb-1">Available Balance</p>
                  <p className={`text-3xl font-light font-mono ${account.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
