import React from 'react';
import { Layers, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-surface-border">
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-violet shadow-md shadow-brand-500/20 ring-1 ring-white/20">
          <Layers className="w-4.5 h-4.5 text-white" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-white">ContextSwitch</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" />
            AI Context Memory
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          title="Refresh Context State"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-surface-secondary rounded-lg transition-colors border border-transparent hover:border-surface-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
