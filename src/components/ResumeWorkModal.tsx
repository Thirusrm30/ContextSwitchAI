import React from 'react';
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  X,
  Zap,
  Clock,
  FileText,
  AlertTriangle,
  Trash2,
  Tag,
} from 'lucide-react';
import { WorkSession } from '../types/context';
import { SessionTimeline } from './SessionTimeline';

interface ResumeWorkModalProps {
  session: WorkSession | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: (session: WorkSession) => void;
  onViewSummary?: (session: WorkSession) => void;
  onDeleteSession?: (session: WorkSession) => void;
}

export const ResumeWorkModal: React.FC<ResumeWorkModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirmRestore,
  onViewSummary,
  onDeleteSession,
}) => {
  if (!isOpen || !session) return null;

  const startedDate = new Date(session.startedAt);
  const timeStr = startedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = startedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const domainSet = new Map<string, string>();
  session.openTabs.forEach((t) => {
    if (!domainSet.has(t.domain)) {
      domainSet.set(t.domain, t.title);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-brand-600/20 via-surface to-surface border-b border-surface-border">
          <div className="absolute top-0 right-0 w-28 h-28 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-violet shadow-lg shadow-brand-500/25 ring-1 ring-white/10 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Resume Your Work</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pick up exactly where you left off
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors hover:bg-surface-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
          {/* Project & Task */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-surface-secondary/70 border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                    Project
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{session.projectName}</h4>
                </div>
                {session.isCurrent && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>

              <div className="border-t border-surface-border/50 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
                  Last Task
                </span>
                <p className="text-xs font-semibold text-slate-100 mt-0.5">
                  {session.currentTask}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {dateStr}, {timeStr}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {session.durationMinutes}m session
                </span>
              </div>
            </div>
          </div>

          {/* What you were working on */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              You were working on
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-surface-secondary/40 p-2.5 rounded-lg border border-surface-border/50">
              {session.summary}
            </p>
          </div>

          {/* Unfinished work */}
          {session.unfinishedWork && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unfinished Work
              </span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/20">
                {session.unfinishedWork}
              </p>
            </div>
          )}

          {/* Relevant Resources */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Relevant Resources ({session.openTabs.length} tabs)
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {session.openTabs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-surface-tertiary/60 text-xs border border-surface-border/50 hover:bg-surface-tertiary transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {t.favicon ? (
                      <img src={t.favicon} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-sm bg-slate-700 shrink-0" />
                    )}
                    <span className="truncate text-slate-200 text-[11px]">{t.title}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0 ml-2 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Domains
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(domainSet.keys()).map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-tertiary/60 border border-surface-border/50 text-[10px] text-slate-300 font-mono"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          {session.tags && session.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {session.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] text-brand-300 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Session Timeline */}
          {session.timeline && session.timeline.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Session Timeline
              </span>
              <div className="p-3 rounded-xl bg-surface-secondary/40 border border-surface-border/50">
                <SessionTimeline events={session.timeline} compact />
              </div>
            </div>
          )}

          {/* Suggested Next Step */}
          {session.suggestedNextStep && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-brand-500/15 to-accent-violet/10 border border-brand-500/30 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300 mt-0.5 shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block">
                  Suggested Next Step
                </span>
                <p className="text-[11px] font-medium text-slate-200 mt-0.5 leading-relaxed">
                  {session.suggestedNextStep}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-surface-border bg-surface-secondary/30 space-y-2">
          {/* Primary action */}
          <button
            onClick={() => onConfirmRestore(session)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:from-brand-500 hover:to-accent-violet/90 shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Resume Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Secondary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewSummary?.(session)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surface-secondary border border-surface-border transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Summary</span>
            </button>
            <button
              onClick={() => {
                onDeleteSession?.(session);
                onClose();
              }}
              className="py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
