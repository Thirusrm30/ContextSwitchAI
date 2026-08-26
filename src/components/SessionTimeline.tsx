import React from 'react';
import {
  Play,
  Globe,
  ArrowRightLeft,
  Bug,
  FileText,
  Code2,
  Square,
  Clock,
} from 'lucide-react';
import { SessionTimelineEvent } from '../types/context';

interface SessionTimelineProps {
  events: SessionTimelineEvent[];
  compact?: boolean;
}

const ICON_MAP: Record<SessionTimelineEvent['icon'], React.ReactNode> = {
  start: <Play className="w-3 h-3" />,
  tab: <Globe className="w-3 h-3" />,
  switch: <ArrowRightLeft className="w-3 h-3" />,
  debug: <Bug className="w-3 h-3" />,
  docs: <FileText className="w-3 h-3" />,
  code: <Code2 className="w-3 h-3" />,
  end: <Square className="w-3 h-3" />,
};

const ICON_COLORS: Record<SessionTimelineEvent['icon'], string> = {
  start: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  tab: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  switch: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  debug: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  docs: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  code: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  end: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ events, compact }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-3">
        <Clock className="w-5 h-5 text-slate-500 mx-auto mb-1" />
        <p className="text-[11px] text-slate-400">No timeline data for this session.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-surface-border" />

      <div className="space-y-0">
        {events.map((event, idx) => {
          const colorClasses = ICON_COLORS[event.icon];
          const isLast = idx === events.length - 1;

          return (
            <div key={event.id} className="relative flex items-start gap-3 group">
              {/* Icon node */}
              <div
                className={`relative z-10 shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-full border ${colorClasses} transition-transform group-hover:scale-110`}
              >
                {ICON_MAP[event.icon]}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${compact ? 'py-1.5' : 'py-2'} ${!isLast ? '' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-300 tabular-nums">
                    {event.time}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-100 truncate">
                    {event.label}
                  </span>
                </div>
                {!compact && (
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate pl-0">
                    {event.description}
                  </p>
                )}
                {!compact && event.domain && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-surface-tertiary/60 border border-surface-border/50 text-[9px] text-slate-400 font-mono">
                    <Globe className="w-2.5 h-2.5" />
                    {event.domain}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
