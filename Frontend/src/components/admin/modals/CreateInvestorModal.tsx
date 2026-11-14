import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

interface CreateInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
}

export default function CreateInvestorModal({
  isOpen,
  onClose,
  onSubmit
}: CreateInvestorModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('investor123');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, email, phone, password });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('investor123');
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
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-redhill-line mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px bg-redhill-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-redhill-gold">
                Client Directory
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Add New Investor
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Full Name <span className="text-redhill-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Email Address <span className="text-redhill-red">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              placeholder="rahul@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all tabular-nums placeholder:text-stone-400"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Initial Password <span className="text-redhill-red">*</span>
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400 font-mono text-xs"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">A unique login ID will be automatically generated upon creation.</p>
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
              {loading ? 'Adding...' : 'Add Investor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
