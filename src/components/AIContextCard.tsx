import React from 'react';
import { Sparkles, Brain, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AIContextResult } from '../types/context';
import { getCategoryDisplay } from '../services/contextEngine';

interface AIContextCardProps {
  aiResult: AIContextResult | null;
  isLoading: boolean;
  providerName: string;
  onReanalyze: () => void;
}

export const AIContextCard: React.FC<AIContextCardProps> = ({
  aiResult,
  isLoading,
  providerName,
  onReanalyze,
}) => {
  if (isLoading && !aiResult) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-brand-600/15 via-surface-secondary to-surface border border-brand-500/30 p-4 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-500/30" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
          </div>
          <div className="h-4 w-16 bg-slate-700 rounded" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-5 w-48 bg-slate-700 rounded" />
          <div className="h-4 w-full bg-slate-800 rounded" />
          <div className="h-4 w-3/4 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!aiResult) {
    return (
      <div className="rounded-xl bg-surface-secondary/70 border border-surface-border p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
          <Brain className="w-4 h-4 text-brand-400" />
          <span>🧠 AI Context Engine Idle</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Open tabs to enable automated AI project and task inference.
        </p>
        <button
          onClick={onReanalyze}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Analyze Activity</span>
        </button>
      </div>
    );
  }

  const catDisplay = getCategoryDisplay(aiResult.category);
  const confidencePercent = Math.round(aiResult.confidence * 100);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600/20 via-surface-secondary to-surface border border-brand-500/35 p-4 shadow-lg shadow-brand-500/5 space-y-3.5">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500/25 border border-brand-500/40 text-brand-300 shadow-sm">
            <Brain className="w-4 h-4 text-brand-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                <span>🧠 AI Detected Context</span>
              </h3>
              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold tracking-wider ${catDisplay.colorClass}`}>
                {catDisplay.label.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{providerName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onReanalyze}
          disabled={isLoading}
          title="Re-analyze context with AI"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors border border-transparent hover:border-surface-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
        </button>
      </div>

      {/* Project & Task */}
      <div className="grid grid-cols-1 gap-2.5 pt-1">
        <div className="p-2.5 rounded-lg bg-surface-tertiary/70 border border-surface-border/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span className="font-medium">Inferred Project</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{confidencePercent}% confidence</span>
            </div>
          </div>
          <p className="text-sm font-bold text-white tracking-tight">
            {aiResult.project}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-tertiary/70 border border-surface-border/80">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
            Current Task Focus
          </span>
          <p className="text-xs font-semibold text-brand-200">
            {aiResult.task}
          </p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="p-2.5 rounded-lg bg-surface/60 border border-surface-border/60 text-xs space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" />
          Summary
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {aiResult.summary}
        </p>
      </div>

      {/* Next Step Suggestion */}
      {aiResult.nextAction && (
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-brand-500/15 to-accent-violet/10 border border-brand-500/30 text-xs flex items-start gap-2">
          <div className="p-1 rounded bg-brand-500/20 text-brand-300 mt-0.5 shrink-0">
            <ArrowRight className="w-3 h-3" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block">
              Suggested Next Step
            </span>
            <p className="text-[11px] font-medium text-slate-200 mt-0.5">
              {aiResult.nextAction}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
