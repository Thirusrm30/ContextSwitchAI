import React from 'react';
import { ArrowRight, CheckCircle, ExternalLink, X, Zap } from 'lucide-react';
import { WorkSession } from '../types/context';

interface ResumeWorkModalProps {
  session: WorkSession | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: (session: WorkSession) => void;
}

export const ResumeWorkModal: React.FC<ResumeWorkModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirmRestore,
}) => {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-surface-border p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Resume Context Session</h3>
              <p className="text-xs text-slate-400">{session.projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task & Summary */}
        <div className="p-3 rounded-lg bg-surface-secondary border border-surface-border space-y-1">
          <span className="text-[10px] font-semibold uppercase text-brand-400 tracking-wider">
            Target Task
          </span>
          <p className="text-xs font-semibold text-slate-100">{session.currentTask}</p>
          <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
            {session.summary}
          </p>
        </div>

        {/* Tabs To Restore */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Workspace tabs to reopen:</span>
            <span className="font-semibold text-slate-200">{session.openTabs.length} tabs</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {session.openTabs.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-1.5 rounded bg-surface-tertiary/60 text-xs border border-surface-border/50"
              >
                <span className="truncate max-w-[200px] text-slate-200">{t.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:bg-surface-secondary border border-surface-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmRestore(session)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:from-brand-500 hover:to-accent-violet/90 shadow-md shadow-brand-500/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Restore Tabs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
