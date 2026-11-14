import React, { useState, useEffect } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface SubInvestmentModalProps {
  isOpen: boolean;
  assignment: any | null;
  onClose: () => void;
  onSubmit: (data: {
    userId: number;
    projectId: number;
    addCapital: number;
    addSqft: number;
    currentPrice: number;
    notes: string;
    transactionDate: string;
  }) => Promise<void>;
}

export default function SubInvestmentModal({
  isOpen,
  assignment,
  onClose,
  onSubmit
}: SubInvestmentModalProps) {
  const [subInvAmount, setSubInvAmount] = useState('');
  const [subInvSqft, setSubInvSqft] = useState('');
  const [subInvPrice, setSubInvPrice] = useState('');
  const [subInvDate, setSubInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [subInvNotes, setSubInvNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setSubInvPrice(String(assignment.market_price_per_sqft || assignment.price_at_investment || ''));
      setSubInvAmount('');
      setSubInvSqft('');
      setSubInvNotes('');
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        userId: assignment.user_id,
        projectId: assignment.project_id,
        addCapital: Number(subInvAmount),
        addSqft: Number(subInvSqft),
        currentPrice: Number(subInvPrice),
        notes: subInvNotes,
        transactionDate: subInvDate
      });
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
      <div className="relative bg-white border border-[#E2DDD5] rounded-xs w-full max-w-lg p-7 sm:p-9 shadow-2xl text-redhill-charcoal max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-5 border-b border-redhill-line mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px bg-redhill-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-redhill-gold">
                Portfolio Allocation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Add Sub-Investment / Tranche
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {assignment.investor_name} &bull; {assignment.project_name}
            </p>
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

        {/* Current State Summary Card */}
        <div className="bg-[#FAF8F5] rounded-xs p-4 border border-[#E5DFD5] grid grid-cols-2 gap-4 text-xs mb-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Current Capital</p>
            <p className="font-semibold text-redhill-charcoal text-base mt-0.5 tabular-nums">
              {formatCurrency(assignment.investment_amount || 0)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">Current Area</p>
            <p className="font-semibold text-redhill-charcoal text-base mt-0.5 tabular-nums">
              {assignment.allotted_sqft?.toLocaleString('en-IN') || 0} sqft
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Additional Capital (₹) <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvAmount}
                onChange={(e) => setSubInvAmount(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Additional Sqft <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvSqft}
                onChange={(e) => setSubInvSqft(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Market Price / Sqft (₹) <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvPrice}
                onChange={(e) => setSubInvPrice(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Transaction Date <span className="text-redhill-red">*</span>
              </label>
              <input
                type="date"
                required
                value={subInvDate}
                onChange={(e) => setSubInvDate(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Remarks / Transaction Notes
            </label>
            <textarea
              rows={2}
              value={subInvNotes}
              onChange={(e) => setSubInvNotes(e.target.value)}
              placeholder="e.g. Additional tranche B allocation, Cheque #884920"
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400 resize-none"
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
              {loading ? 'Adding...' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
