import React from 'react';
import { PlayCircle, BookmarkPlus, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onResumeClick: () => void;
  onSaveSnapshot: () => void;
  isCurrentActive: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onResumeClick,
  onSaveSnapshot,
}) => {
  return (
    <div className="space-y-2">
      {/* Primary Hero Action Button */}
      <button
        onClick={onResumeClick}
        className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent-violet p-3.5 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.99] transition-all"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                Resume My Work
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <p className="text-[11px] text-white/80">
                Restore last tabs, focus state & memory
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Secondary Quick Action */}
      <button
        onClick={onSaveSnapshot}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-secondary/80 hover:bg-surface-secondary text-slate-300 hover:text-white border border-surface-border text-xs font-semibold transition-all"
      >
        <BookmarkPlus className="w-3.5 h-3.5 text-brand-400" />
        <span>Save Current Context Snapshot</span>
      </button>
    </div>
  );
};
