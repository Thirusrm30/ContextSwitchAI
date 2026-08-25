import { AlertCircle, Check, Coffee, X } from 'lucide-react';

interface DistractionAlertProps {
  isOpen: boolean;
  reason?: string;
  currentTask: string;
  onContinueWorking: () => void;
  onTakeBreak: () => void;
  onDismiss: () => void;
}

export const DistractionAlert: React.FC<DistractionAlertProps> = ({
  isOpen,
  reason,
  currentTask,
  onContinueWorking,
  onTakeBreak,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-surface-secondary to-amber-500/10 border border-amber-500/40 p-4 shadow-xl shadow-amber-500/10 space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300">
              Possible context switch detected.
            </h4>
            <p className="text-[11px] text-slate-400">
              Activity drift from current focus
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Details */}
      <div className="p-2.5 rounded-lg bg-surface-tertiary/70 border border-surface-border text-xs space-y-1">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Current Focus: <span className="text-slate-200 normal-case font-normal">{currentTask}</span>
        </div>
        {reason && (
          <p className="text-[11px] text-amber-200/90 leading-relaxed pt-0.5">
            {reason}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onContinueWorking}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Continue Working</span>
        </button>

        <button
          onClick={onTakeBreak}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Take Break</span>
        </button>
      </div>
    </div>
  );
};
