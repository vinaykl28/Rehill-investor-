import React, { useState } from 'react';
import { User, Project } from '../../../types';
import { PlusCircle, X, ShieldCheck } from 'lucide-react';

interface AssignProjectModalProps {
  isOpen: boolean;
  investors: User[];
  projects: Project[];
  onClose: () => void;
  onSubmit: (data: {
    userId: string;
    projectId: string;
    contribution: string;
    investmentAmount: string;
    allottedSqft: string;
    marketPricePerSqft: string;
  }) => Promise<void>;
}

export default function AssignProjectModal({
  isOpen,
  investors,
  projects,
  onClose,
  onSubmit
}: AssignProjectModalProps) {
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [contribution, setContribution] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [allottedSqft, setAllottedSqft] = useState('');
  const [marketPricePerSqft, setMarketPricePerSqft] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        userId,
        projectId,
        contribution,
        investmentAmount,
        allottedSqft,
        marketPricePerSqft
      });
      setUserId('');
      setProjectId('');
      setContribution('');
      setInvestmentAmount('');
      setAllottedSqft('');
      setMarketPricePerSqft('');
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

      {/* Modal Dialog with sharp architectural framing */}
      <div className="relative bg-white border border-[#E2DDD5] rounded-xs w-full max-w-lg p-7 sm:p-9 shadow-2xl text-redhill-charcoal max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-redhill-line mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px bg-redhill-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-redhill-gold">
                Allocation Management
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Assign Project to Investor
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

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Investor Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Select Investor <span className="text-redhill-red">*</span>
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all cursor-pointer font-normal"
              required
            >
              <option value="" disabled className="bg-white text-stone-400">Choose an investor...</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-white text-stone-900">
                  {inv.name} ({inv.email}) {inv.login_id ? `— ${inv.login_id}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Project Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Select Project <span className="text-redhill-red">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all cursor-pointer font-normal"
              required
            >
              <option value="" disabled className="bg-white text-stone-400">Choose a project...</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-white text-stone-900">
                  {proj.name} — {proj.location}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Sqft */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Investment Amount (₹) <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
                placeholder="e.g. 25000000"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Allotted Sqft <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                value={allottedSqft}
                onChange={(e) => setAllottedSqft(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
                placeholder="e.g. 1200"
                required
              />
            </div>
          </div>

          {/* Market Price & Display Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Market Price/Sqft (₹) <span className="text-redhill-red">*</span>
              </label>
              <input
                type="number"
                value={marketPricePerSqft}
                onChange={(e) => setMarketPricePerSqft(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
                placeholder="e.g. 15000"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
                Display Label
              </label>
              <input
                type="text"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
                placeholder="e.g. ₹2.5 Cr (Unit 402)"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-redhill-line">
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
              {loading ? 'Assigning...' : 'Assign Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
