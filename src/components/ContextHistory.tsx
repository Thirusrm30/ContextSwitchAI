import React, { useState } from 'react';
import {
  FolderKanban,
  Play,
  Clock,
  Layers,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ProjectHistory } from '../types/context';

interface ContextHistoryProps {
  projects: ProjectHistory[];
  onResumeProject: (project: ProjectHistory) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ContextHistory: React.FC<ContextHistoryProps> = ({
  projects,
  onResumeProject,
  onDeleteProject,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Recent Work
          </h3>
        </div>
        <div className="rounded-lg bg-surface-secondary/50 border border-surface-border p-4 text-center">
          <p className="text-xs text-slate-400">No project history yet.</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Start browsing to build your work memory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Recent Work
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {projects.map((project) => {
          const isExpanded = expandedId === project.id;

          return (
            <div
              key={project.id}
              className="rounded-xl bg-surface-secondary/70 border border-surface-border hover:border-slate-600 transition-all overflow-hidden"
            >
              {/* Project Header */}
              <div
                className="p-3 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 text-brand-400 shrink-0 mt-0.5">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {project.projectName}
                        </h4>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                        {project.currentTask}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {project.lastActiveAt}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Layers className="w-3 h-3" />
                          {project.sessionCount} sessions
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeProject(project);
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 active:scale-95 transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-surface-border/50 space-y-3 animate-fadeIn">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-3">
                    <div className="p-2 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-center">
                      <BarChart3 className="w-3.5 h-3.5 text-brand-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400 block">Avg Score</span>
                      <span className="text-xs font-bold text-white">{project.averageContextScore}%</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-center">
                      <Layers className="w-3.5 h-3.5 text-accent-cyan mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400 block">Total Tabs</span>
                      <span className="text-xs font-bold text-white">{project.totalTabsOpened}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400 block">Sessions</span>
                      <span className="text-xs font-bold text-white">{project.sessionCount}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] text-brand-300 font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delete button */}
                  {onDeleteProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove from history</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
