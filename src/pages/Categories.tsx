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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white/90">Categories</h2>
          <p className="text-sm text-white/50 mt-1">Manage your income and expense categories</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] rounded-3xl border border-white/10 shadow-xl">
          <div className="flex flex-col items-center justify-center text-white/40">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-base">No categories found.</p>
            <p className="text-sm mt-1">Create one to start organizing your transactions.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="p-6 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-colors opacity-10 group-hover:opacity-20" style={{ backgroundColor: category.color }} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/90 text-lg">{category.name}</h3>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{category.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
}
