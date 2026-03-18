import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Tag, Trash2 } from "lucide-react";
import { useCategories } from "../lib/hooks/useFinanceData";
import { AddCategoryModal } from "../components/modals/AddCategoryModal";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { toast } from "sonner";

export default function Categories() {
  const { categories, loading } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, "categories");
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income').length;
  const expenseCategories = categories.filter(c => c.type === 'expense').length;

  return (
    <div className="space-y-12 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest border border-brand/20">
              Categories
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter leading-none">
            Your <span className="text-brand italic">Categories</span>
          </h2>
          <p className="text-sm text-white/40 max-w-md font-medium leading-relaxed">
            Group your transactions into categories to keep things organised.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-brand text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-dark transition-all shadow-[0_0_40px_rgba(16,185,129,0.15)] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Categories', value: categories.length, icon: Tag, color: 'brand' },
          { label: 'Income Types', value: incomeCategories, icon: Tag, color: 'brand' },
          { label: 'Expense Types', value: expenseCategories, icon: Tag, color: 'brand' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[32px] bg-[#141414] border border-white/[0.03] relative overflow-hidden group shadow-2xl"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-[60px] group-hover:bg-brand/10 transition-all duration-700`} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-white tracking-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24 bg-[#141414] rounded-[40px] border border-white/[0.03] shadow-2xl">
          <div className="flex flex-col items-center justify-center text-white/20">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
              <Tag className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-lg font-display font-bold text-white/40">No Categories Yet</p>
            <p className="text-sm mt-2 font-medium">Add your first category to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="p-8 rounded-[40px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.03] hover:border-white/[0.1] transition-all duration-500 group relative overflow-hidden shadow-2xl"
            >
              <div 
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] transition-opacity duration-1000 opacity-10 group-hover:opacity-20" 
                style={{ backgroundColor: category.color }} 
              />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div 
                    className="w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl border border-white/[0.05]"
                    style={{ backgroundColor: `${category.color}10`, color: category.color }}
                  >
                    <Tag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-2xl tracking-tight">{category.name}</h3>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{category.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-3 text-white/10 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
