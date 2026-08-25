import React, { useState } from 'react';
import { FolderTree, ChevronDown, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import { TabGroup } from '../types/context';
import { getCategoryDisplay } from '../services/contextEngine';

interface TabGroupsViewProps {
  groups: TabGroup[];
}

export const TabGroupsView: React.FC<TabGroupsViewProps> = ({ groups }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    groups.length > 0 ? groups[0].groupName : null
  );

  if (groups.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Tab Groups
          </h3>
        </div>
        <div className="rounded-lg bg-surface-secondary/50 border border-surface-border p-4 text-center">
          <p className="text-xs text-slate-400">No tab groups detected yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Auto-Detected Tab Groups
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {groups.length} groups
        </span>
      </div>

      <div className="space-y-1.5">
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.groupName;
          const catDisplay = getCategoryDisplay(group.primaryCategory);

          return (
            <div
              key={group.groupName}
              className="rounded-xl border border-surface-border overflow-hidden"
            >
              {/* Group Header */}
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.groupName)}
                className="w-full flex items-center justify-between p-2.5 bg-surface-secondary/80 hover:bg-surface-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-slate-100">{group.groupName}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-wider ${catDisplay.colorClass}`}>
                    {catDisplay.label.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {group.tabs.length} tabs
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold">
                    {group.confidence}%
                  </span>
                </div>
              </button>

              {/* Expanded Tab List */}
              {isExpanded && (
                <div className="bg-surface/80 border-t border-surface-border/50">
                  {group.tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center gap-2 px-3 py-2 border-b border-surface-border/30 last:border-b-0 hover:bg-surface-secondary/40 transition-colors group"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-200 truncate">{tab.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{tab.domain}</p>
                      </div>
                      {tab.isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold tracking-wider shrink-0">
                          ACTIVE
                        </span>
                      )}
                      {tab.timeSpentSeconds != null && tab.timeSpentSeconds > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {Math.floor(tab.timeSpentSeconds / 60)}m
                        </span>
                      )}
                      <a
                        href={tab.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400 hover:text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
