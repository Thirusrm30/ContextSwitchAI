import React from 'react';
import { Activity, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { getScoreColor } from '../utils/formatters';

interface ContextScoreGaugeProps {
  score: number;
  focusState: string;
  switchesCount: number;
}

export const ContextScoreGauge: React.FC<ContextScoreGaugeProps> = ({
  score,
  focusState,
  switchesCount,
}) => {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-surface-secondary/80 to-surface border border-surface-border p-4 shadow-sm">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Context Score
          </h3>
        </div>
        
        {/* Switching Health Badge */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
          {score >= 80 ? (
            <>
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>High Coherence</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Context Drift</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular Progress Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
            {/* Track */}
            <circle
              cx="48"
              cy="48"
              r="38"
              stroke="currentColor"
              strokeWidth="7"
              className="text-surface-tertiary"
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="48"
              cy="48"
              r="38"
              stroke={colors.ring}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-white tracking-tight">{score}%</span>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Focus State:</span>
            <span className="font-semibold text-slate-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {focusState}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Switching Frequency:</span>
            <span className="font-mono text-slate-200">{switchesCount} shifts / hr</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Tab Alignment:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 94% Relevant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
