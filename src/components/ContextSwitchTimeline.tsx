import React from 'react';
import { ArrowRight, Clock, Zap } from 'lucide-react';
import { ContextSwitchEvent } from '../types/context';
import { getCategoryDisplay } from '../services/contextEngine';

interface ContextSwitchTimelineProps {
  events: ContextSwitchEvent[];
}

export const ContextSwitchTimeline: React.FC<ContextSwitchTimelineProps> = ({ events }) => {
  const displayEvents = events.slice(-10).reverse();

  if (displayEvents.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Context Switch Events
          </h3>
        </div>
        <div className="rounded-lg bg-surface-secondary/50 border border-surface-border p-4 text-center">
          <p className="text-xs text-slate-400">No context switches detected yet.</p>
          <p className="text-[10px] text-slate-500 mt-1">Switches are recorded when you move between different domains.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Context Switch Events
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {events.length} total
        </span>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {displayEvents.map((event) => {
          const fromCat = getCategoryDisplay(event.fromCategory);
          const toCat = getCategoryDisplay(event.toCategory);
          const time = new Date(event.timestamp);
          const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={event.id}
              className="rounded-lg bg-surface-secondary/60 border border-surface-border/70 p-2.5 hover:bg-surface-secondary transition-colors"
            >
              <div className="flex items-center gap-2 text-xs">
                {/* From */}
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-wider mb-1 ${fromCat.colorClass}`}>
                    {fromCat.label.toUpperCase()}
                  </span>
                  <p className="text-slate-300 truncate text-[11px]">{event.fromDomain}</p>
                </div>

                {/* Arrow */}
                <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30">
                  <ArrowRight className="w-3 h-3 text-brand-400" />
                </div>

                {/* To */}
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-semibold tracking-wider mb-1 ${toCat.colorClass}`}>
                    {toCat.label.toUpperCase()}
                  </span>
                  <p className="text-slate-300 truncate text-[11px]">{event.toDomain}</p>
                </div>

                {/* Timestamp */}
                <span className="shrink-0 text-[10px] text-slate-500 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
