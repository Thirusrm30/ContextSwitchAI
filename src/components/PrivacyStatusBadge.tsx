import React from 'react';
import { ShieldCheck, Lock, HardDrive, Trash2 } from 'lucide-react';

interface PrivacyStatusBadgeProps {
  onClearData?: () => void;
  isClearing?: boolean;
}

export const PrivacyStatusBadge: React.FC<PrivacyStatusBadgeProps> = ({
  onClearData,
  isClearing,
}) => {
  return (
    <div className="rounded-xl bg-surface-secondary/50 border border-surface-border p-3 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span>Privacy Mode: Local Only</span>
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3 h-3 text-slate-400" />
              Zero cloud tracking • On-device Chrome storage
            </p>
          </div>
        </div>

        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
          Secure
        </div>
      </div>

      {/* Clear Context Data Button */}
      {onClearData && (
        <button
          onClick={onClearData}
          disabled={isClearing}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 hover:border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
          <span>{isClearing ? 'Clearing...' : 'Clear Context Data'}</span>
        </button>
      )}
    </div>
  );
};
