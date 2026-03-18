import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, X, Receipt } from 'lucide-react';
import { processReceipt } from '../../lib/receiptService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { toast } from 'sonner';

interface AddReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddReceiptModal({ isOpen, onClose }: AddReceiptModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;
    setLoading(true);
    try {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = (reader.result as string).split(',')[1];
        const receiptData = await processReceipt(base64Image, file.type);
        
        await addDoc(collection(db, 'receipts'), {
          userId: user.uid,
          ...receiptData,
          imageUrl: URL.createObjectURL(file), // In a real app, upload to storage
          rawText: ''
        });
        toast.success('Receipt processed successfully');
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Scan Receipt</h2>
          <button onClick={onClose} className="text-white/78 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-white/78 mx-auto mb-4" />
          <p className="text-white/90">Drag & drop receipt image here, or click to select</p>
        </div>
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing receipt...
          </div>
        )}
      </div>
    </div>
  );
}
