import React, { useState } from 'react';
import {
  History,
  Play,
  Check,
  Clock,
  Layers,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  Tag,
} from 'lucide-react';
import { WorkSession } from '../types/context';

interface RecentSessionsProps {
  sessions: WorkSession[];
  onResumeSession: (session: WorkSession) => void;
  onDeleteSession?: (session: WorkSession) => void;
  onViewSummary?: (session: WorkSession) => void;
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  onResumeSession,
  onDeleteSession,
  onViewSummary,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Recent Work Sessions
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">Context Memory</span>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id;

          return (
            <div
              key={session.id}
              className={`rounded-xl border p-3 transition-all ${
                session.isCurrent
                  ? 'bg-gradient-to-r from-brand-500/10 via-surface-secondary to-surface border-brand-500/30'
                  : 'bg-surface-secondary/70 hover:bg-surface-secondary border-surface-border hover:border-slate-600'
              }`}
            >
              {/* Session Header */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    <h4 className="text-xs font-bold text-white truncate">
                      {session.projectName}
                    </h4>
                    {session.isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5 pl-5">
                    {session.currentTask}
                  </p>
                </div>

                <button
                  onClick={() => onResumeSession(session)}
                  disabled={session.isCurrent}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    session.isCurrent
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 active:scale-95'
                  }`}
                >
                  {session.isCurrent ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Current</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed pl-5">
                {session.summary}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-surface-border/50 pl-5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {session.lastActiveAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    {session.openTabs.length} tabs
                  </span>
                </div>
                <span className="font-mono text-slate-300 font-semibold">
                  {session.contextScore}% score
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-surface-border/50 space-y-3 pl-5 animate-fadeIn">
                  {/* Suggested Next Step */}
                  {session.suggestedNextStep && (
                    <div className="p-2.5 rounded-lg bg-gradient-to-r from-brand-500/10 to-accent-violet/5 border border-brand-500/20 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-bold text-brand-300 uppercase tracking-wider block">
                          Next Step
                        </span>
                        <p className="text-[11px] text-slate-200 mt-0.5">{session.suggestedNextStep}</p>
                      </div>
                    </div>
                  )}

                  {/* Unfinished Work */}
                  {session.unfinishedWork && (
                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                        Unfinished Work
                      </span>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">{session.unfinishedWork}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {session.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[9px] text-brand-300 font-semibold"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tabs preview */}
                  <div className="max-h-20 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {session.openTabs.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-1 rounded bg-surface-tertiary/40 text-[10px] border border-surface-border/30"
                      >
                        <span className="truncate text-slate-300">{t.title}</span>
                        <span className="text-slate-500 shrink-0 ml-1 font-mono">{t.domain}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewSummary?.(session)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-surface-tertiary border border-surface-border transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Summary</span>
                    </button>
                    {onDeleteSession && !session.isCurrent && (
                      <button
                        onClick={() => onDeleteSession(session)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
