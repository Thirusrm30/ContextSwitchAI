import React from 'react';
import { Layers, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';
import { TabItem } from '../types/context';
import { getCategoryBadge } from '../utils/formatters';

interface OpenTabsListProps {
  tabs: TabItem[];
  onFocusTab?: (tab: TabItem) => void;
}

export const OpenTabsList: React.FC<OpenTabsListProps> = ({ tabs, onFocusTab }) => {
  const handleTabClick = (tab: TabItem) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && typeof tab.id === 'number') {
      chrome.tabs.update(tab.id, { active: true });
    } else if (onFocusTab) {
      onFocusTab(tab);
    } else {
      window.open(tab.url, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Open Project Tabs
          </h3>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-border text-slate-300">
          {tabs.length} tabs in context
        </span>
      </div>

      <div className="space-y-1.5">
        {tabs.map((tab) => {
          const badge = getCategoryBadge(tab.category);

          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                tab.isActive
                  ? 'bg-brand-500/10 border-brand-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : 'bg-surface-secondary/60 hover:bg-surface-secondary border-surface-border/70 hover:border-slate-600'
              }`}
            >
              {/* Tab Icon / Status */}
              <div className="mt-0.5 shrink-0">
                {tab.isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-400" />
                ) : (
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                )}
              </div>

              {/* Tab Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-100 group-hover:text-brand-300 transition-colors truncate">
                    {tab.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                    {tab.domain}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold tracking-wider ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
