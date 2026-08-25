import React from 'react';
import { FolderKanban, CheckSquare, Clock, ArrowRightLeft, Sparkles } from 'lucide-react';

interface CurrentContextCardProps {
  activeProject: string;
  currentTask: string;
  durationMinutes: number;
  switchesToday: number;
}

export const CurrentContextCard: React.FC<CurrentContextCardProps> = ({
  activeProject,
  currentTask,
  durationMinutes,
  switchesToday,
}) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-surface-secondary to-surface border border-surface-border p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-brand-400 uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Active Working Context
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-medium">
          <Clock className="w-3 h-3 text-brand-400" />
          <span>{durationMinutes}m active</span>
        </div>
      </div>

      {/* Project Title */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
          <FolderKanban className="w-3.5 h-3.5 text-brand-400" />
          <span>Active Project</span>
        </div>
        <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-between">
          <span>{activeProject}</span>
          <span className="text-[10px] font-normal px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
            In Progress
          </span>
        </h2>
      </div>

      {/* Current Task */}
      <div className="p-2.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/80">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
          <CheckSquare className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-medium">Current Task Focus</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 pl-5">
          {currentTask}
        </p>
      </div>

      {/* Context Switching Indicator */}
      <div className="mt-3 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ArrowRightLeft className="w-3.5 h-3.5 text-brand-400" />
          <span>Context switches today:</span>
        </div>
        <span className="font-semibold text-slate-200 bg-surface-secondary px-2 py-0.5 rounded border border-surface-border text-xs">
          {switchesToday} switches
        </span>
      </div>
    </div>
  );
};
