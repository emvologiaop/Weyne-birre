import React, { useState } from "react";
import { Plus, Search, Filter, Loader2, Receipt, Trash2 } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { useTransactions, useCategories, useAccounts } from "../lib/hooks/useFinanceData";
import { AddTransactionModal } from "../components/modals/AddTransactionModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

export default function Transactions() {
  const { transactions, loading } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    account: "all",
    startDate: "",
    endDate: ""
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaction deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category === "all" || tx.categoryId === filters.category;
    const matchesAccount = filters.account === "all" || tx.accountId === filters.account;
    const txDate = new Date(tx.date);
    const matchesDate = 
      (!filters.startDate || txDate >= new Date(filters.startDate)) &&
      (!filters.endDate || txDate <= new Date(filters.endDate));
      
    return matchesSearch && matchesCategory && matchesAccount && matchesDate;
  });

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "Uncategorized";
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium transition-colors ${showFilters ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#141414] text-white/80 hover:bg-white/5'}`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#141414] border border-white/10">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            value={filters.account}
            onChange={(e) => setFilters(f => ({ ...f, account: e.target.value }))}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input 
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          />
          <input 
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          />
        </div>
      )}

      {/* Transactions List */}
      <div className="rounded-3xl bg-[#141414] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/40 uppercase bg-black/20 border-b border-white/10">
              <tr>
                <th className="px-6 py-5 font-medium tracking-wider">Date</th>
                <th className="px-6 py-5 font-medium tracking-wider">Description</th>
                <th className="px-6 py-5 font-medium tracking-wider">Category</th>
                <th className="px-6 py-5 font-medium tracking-wider">Status</th>
                <th className="px-6 py-5 font-medium tracking-wider text-right">Amount</th>
                <th className="px-6 py-5 font-medium tracking-wider text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-white/40">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-base">No transactions found.</p>
                      <p className="text-sm mt-1">Try adjusting your filters or add a new transaction.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.04] transition-colors cursor-pointer group">
                    <td className="px-6 py-5 whitespace-nowrap text-white/50 group-hover:text-white/70 transition-colors">
                      {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 font-medium text-white/90">
                      {tx.description}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-white/70 border border-white/5">
                        {getCategoryName(tx.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        tx.status === 'cleared' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {tx.status || 'cleared'}
                      </span>
                    </td>
                    <td className={`px-6 py-5 text-right font-mono font-medium text-base ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-white/90'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={(e) => handleDelete(tx.id, e)}
                        className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
