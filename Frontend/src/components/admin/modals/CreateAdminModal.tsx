import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { ROLE_CONFIG } from '../../../constants/roles';
import { Role } from '../../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: Role; password: string }) => Promise<void>;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  onSubmit
}: CreateAdminModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('site_manager');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, email, role, password });
      setName('');
      setEmail('');
      setRole('site_manager');
      setPassword('admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xs max-w-2xl w-full border border-[#E2DDD5] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-redhill-line flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-5 h-px bg-redhill-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-redhill-gold">
                Access Governance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Add Staff Administrator
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Assign operational role and security credentials</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-900 rounded-xs transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="ramesh@redhillinfra.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-2">Select Staff Role & Access Scope</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
                const isSelected = role === roleKey;
                const RoleIcon = cfg.icon;
                return (
                  <button
                    type="button"
                    key={roleKey}
                    onClick={() => setRole(roleKey as Role)}
                    className={cn(
                      "p-3.5 rounded-xs border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between",
                      isSelected
                        ? "bg-white border-stone-800 shadow-md ring-1 ring-stone-800"
                        : "bg-white border-[#E5DFD5] hover:border-stone-400"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={cn("w-7 h-7 rounded-xs flex items-center justify-center border", cfg.bg, cfg.color, cfg.border)}>
                          <RoleIcon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-redhill-charcoal text-xs uppercase tracking-wider">{cfg.label}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">{cfg.tag}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Permissions Card */}
            {role && ROLE_CONFIG[role] && (
              <div className="mt-4 p-4 rounded-xs border border-[#E5DFD5] bg-[#FAF8F5]">
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-xs border bg-white", ROLE_CONFIG[role].color, ROLE_CONFIG[role].border)}>
                    {React.createElement(ROLE_CONFIG[role].icon, { className: "w-4 h-4" })}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-redhill-charcoal uppercase tracking-wider">{ROLE_CONFIG[role].label} Scope</p>
                    <p className="text-xs text-stone-600 mt-0.5">{ROLE_CONFIG[role].desc}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {ROLE_CONFIG[role].permissions.map((perm, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-white text-stone-700 px-2 py-0.5 rounded-xs border border-[#E5DFD5]">
                          ✓ {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700">Initial Password</label>
              <button
                type="button"
                onClick={() => setPassword('Redhill@' + Math.floor(1000 + Math.random() * 9000))}
                className="text-[11px] text-stone-800 hover:underline font-semibold cursor-pointer"
              >
                ⚡ Generate Password
              </button>
            </div>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-xs font-mono text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all"
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
              {loading ? 'Creating...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
