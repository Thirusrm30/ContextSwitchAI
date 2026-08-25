import React from 'react';
import { History, Play, Check, Clock, Layers } from 'lucide-react';
import { WorkSession } from '../types/context';

interface RecentSessionsProps {
  sessions: WorkSession[];
  onResumeSession: (session: WorkSession) => void;
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  onResumeSession,
}) => {
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
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`rounded-xl border p-3 transition-all ${
              session.isCurrent
                ? 'bg-gradient-to-r from-brand-500/10 via-surface-secondary to-surface border-brand-500/30'
                : 'bg-surface-secondary/70 hover:bg-surface-secondary border-surface-border hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    {session.projectName}
                  </h4>
                  {session.isCurrent && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
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

            <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
              {session.summary}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-surface-border/50">
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
          </div>
        ))}
      </div>
    </div>
  );
};
