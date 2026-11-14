import React, { useState } from 'react';
import { IndianRupee, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'receipt' | 'invoice';
    amount: string;
    date: string;
    notes: string;
    file: File | null;
  }) => Promise<void>;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit
}: RecordPaymentModalProps) {
  const [payType, setPayType] = useState<'receipt' | 'invoice'>('receipt');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payFile, setPayFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        type: payType,
        amount: payAmount,
        date: payDate,
        notes: payNotes,
        file: payFile
      });
      setPayAmount('');
      setPayNotes('');
      setPayFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white border border-[#E2DDD5] rounded-xs max-w-md w-full p-7 sm:p-9 shadow-2xl text-redhill-charcoal max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-5 border-b border-redhill-line mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px bg-redhill-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-redhill-gold">
                Financial Ledger
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Record Transaction
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1.5 text-stone-400 hover:text-redhill-charcoal hover:bg-stone-100 rounded-xs transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayType('receipt')}
                className={cn(
                  "py-2.5 px-3 text-xs font-semibold uppercase tracking-[0.12em] rounded-xs border transition-all cursor-pointer text-center",
                  payType === 'receipt'
                    ? "bg-[#191A1E] text-white border-[#191A1E]"
                    : "bg-white text-stone-600 border-[#D5CEC2] hover:border-stone-800"
                )}
              >
                Receipt (Credit)
              </button>
              <button
                type="button"
                onClick={() => setPayType('invoice')}
                className={cn(
                  "py-2.5 px-3 text-xs font-semibold uppercase tracking-[0.12em] rounded-xs border transition-all cursor-pointer text-center",
                  payType === 'invoice'
                    ? "bg-[#191A1E] text-white border-[#191A1E]"
                    : "bg-white text-stone-600 border-[#D5CEC2] hover:border-stone-800"
                )}
              >
                Invoice (Debit)
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Amount (₹) <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Date <span className="text-redhill-red">*</span>
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Reference / Notes
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              placeholder="e.g. RTGS UTR #9821829"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Attachment (PDF / Image)
            </label>
            <input
              type="file"
              onChange={e => setPayFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-xs file:border file:border-[#D5CEC2] file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.12em] file:bg-stone-50 file:text-stone-700 hover:file:bg-stone-100 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center gap-3 border-t border-redhill-line">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xs border border-[#D5CEC2] hover:border-stone-800 text-stone-700 hover:text-stone-900 bg-white text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xs bg-redhill-charcoal hover:bg-redhill-red text-white text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
