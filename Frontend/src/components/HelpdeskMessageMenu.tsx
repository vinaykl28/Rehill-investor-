import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';

interface HelpdeskMessageMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

/**
 * WhatsApp-style subtle chevron dropdown for editing or deleting a sent helpdesk message.
 */
export function HelpdeskMessageMenu({ onEdit, onDelete, disabled = false }: HelpdeskMessageMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Message options"
        aria-expanded={open}
        className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
          open
            ? 'opacity-100 bg-white/15 text-white'
            : 'opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 text-white/75 hover:text-white hover:bg-white/15'
        }`}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 z-30 w-32 bg-white border border-redhill-line rounded-xl shadow-xl py-1 text-redhill-charcoal"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 hover:bg-redhill-ivory transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-stone-500" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-left text-xs font-medium text-red-700 flex items-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface HelpdeskInlineEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

/**
 * Compact inline message editor displayed inside the bubble while editing.
 */
export function HelpdeskInlineEditor({ value, onChange, onSave, onCancel, saving = false }: HelpdeskInlineEditorProps) {
  return (
    <div className="space-y-2 min-w-[210px] sm:min-w-[260px]">
      <textarea
        rows={2}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        className="w-full bg-white/10 border border-white/25 rounded-lg px-2.5 py-2 text-[13px] text-white placeholder-white/50 focus:outline-none focus:border-white/60 resize-y"
        placeholder="Edit message..."
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white/85 cursor-pointer disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !value.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-redhill-charcoal hover:bg-redhill-sand cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
