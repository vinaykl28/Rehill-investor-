import React, { useState, useRef } from 'react';
import { Building2, X, Upload, Link as LinkIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    location: string;
    status: string;
    imageUrl: string;
    completionPercentage: number;
    description: string;
    imageFile: File | null;
  }) => Promise<void>;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Construction');
  const [imageUrl, setImageUrl] = useState('');
  const [completionPercentage] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        location,
        status,
        imageUrl,
        completionPercentage,
        description,
        imageFile: imageUploadType === 'file' ? imageFile : null
      });
      setName('');
      setLocation('');
      setImageUrl('');
      setDescription('');
      setImageFile(null);
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
                Portfolio Development
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal text-redhill-charcoal font-serif tracking-tight">
              Create New Development
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
              Development Name <span className="text-redhill-red">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              placeholder="e.g. Redhill Sovereign Sky-Decks"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Location <span className="text-redhill-red">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
              placeholder="e.g. Indiranagar, Bengaluru"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all cursor-pointer"
            >
              <option value="Planning">Planning</option>
              <option value="Approval">Approval</option>
              <option value="Construction">Construction</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700">
                Architectural Cover Image
              </label>
              <div className="flex bg-stone-100 p-0.5 rounded-xs border border-stone-200">
                <button
                  type="button"
                  onClick={() => setImageUploadType('url')}
                  className={cn(
                    "px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 cursor-pointer transition-all",
                    imageUploadType === 'url' ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  )}
                >
                  <LinkIcon className="w-3 h-3" /> URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadType('file')}
                  className={cn(
                    "px-2.5 py-1 rounded-xs text-[10px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1 cursor-pointer transition-all",
                    imageUploadType === 'file' ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-900"
                  )}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
              </div>
            </div>

            {imageUploadType === 'url' ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400"
                placeholder="https://images.unsplash.com/..."
              />
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-[#D5CEC2] hover:border-stone-800 rounded-xs p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-stone-50/50 hover:bg-stone-50"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                  accept="image/*" 
                  className="hidden" 
                />
                <Upload className="w-5 h-5 text-stone-500 mb-1" />
                <p className="text-xs text-stone-700 font-medium">
                  {imageFile ? imageFile.name : "Click to select architectural photo"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-[#D5CEC2] rounded-xs text-sm text-redhill-charcoal outline-none focus:border-redhill-charcoal focus:ring-1 focus:ring-redhill-charcoal transition-all placeholder:text-stone-400 resize-y"
              placeholder="Brief architectural overview of the development, amenities, and vision..."
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
              {loading ? 'Creating...' : 'Create Development'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
