import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  HardDrive,
  Trash2,
  EyeOff,
  Globe,
  Plus,
  X,
  AlertTriangle,
  History,
} from 'lucide-react';
import type { PrivacySettings as PrivacySettingsType } from '../types/context';

interface PrivacySettingsPanelProps {
  settings: PrivacySettingsType;
  onSave: (settings: PrivacySettingsType) => void;
  onClearAllSessions?: () => void;
  isClearing?: boolean;
}

export const PrivacySettingsPanel: React.FC<PrivacySettingsPanelProps> = ({
  settings,
  onSave,
  onClearAllSessions,
  isClearing,
}) => {
  const [localSettings, setLocalSettings] = useState<PrivacySettingsType>({ ...settings });
  const [newDomain, setNewDomain] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleToggleHistory = () => {
    const updated = { ...localSettings, historyEnabled: !localSettings.historyEnabled };
    setLocalSettings(updated);
    onSave(updated);
  };

  const handleToggleClearOnExit = () => {
    const updated = { ...localSettings, clearAllOnExit: !localSettings.clearAllOnExit };
    setLocalSettings(updated);
    onSave(updated);
  };

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    if (localSettings.excludedDomains.includes(domain)) return;
    const updated = {
      ...localSettings,
      excludedDomains: [...localSettings.excludedDomains, domain],
    };
    setLocalSettings(updated);
    onSave(updated);
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = {
      ...localSettings,
      excludedDomains: localSettings.excludedDomains.filter((d) => d !== domain),
    };
    setLocalSettings(updated);
    onSave(updated);
  };

  return (
    <div className="rounded-xl bg-surface-secondary/50 border border-surface-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
              <span>Privacy Controls</span>
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3 h-3" />
              Zero cloud tracking
            </p>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
          Secure
        </div>
      </div>

      {/* Session History Toggle */}
      <div className="space-y-2">
        <button
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-tertiary/40 border border-surface-border/50 hover:bg-surface-tertiary transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-brand-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Session History</span>
              <span className="text-[10px] text-slate-400">
                {localSettings.historyEnabled ? 'Tracking work sessions' : 'History disabled'}
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-5 rounded-full transition-colors relative ${
              localSettings.historyEnabled ? 'bg-brand-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                localSettings.historyEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>

        {/* Clear on Exit Toggle */}
        <button
          onClick={handleToggleClearOnExit}
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-tertiary/40 border border-surface-border/50 hover:bg-surface-tertiary transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Clear on Exit</span>
              <span className="text-[10px] text-slate-400">
                {localSettings.clearAllOnExit ? 'Auto-delete when browser closes' : 'Keep data between sessions'}
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-5 rounded-full transition-colors relative ${
              localSettings.clearAllOnExit ? 'bg-amber-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                localSettings.clearAllOnExit ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Excluded Domains */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-slate-200">Excluded Domains</span>
        </div>
        <p className="text-[10px] text-slate-400">
          These domains will not be tracked or stored in session history.
        </p>

        {/* Domain Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
            placeholder="e.g. netflix.com"
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50"
          />
          <button
            onClick={handleAddDomain}
            disabled={!newDomain.trim()}
            className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Excluded List */}
        {localSettings.excludedDomains.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {localSettings.excludedDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 font-mono"
              >
                {domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="text-rose-400 hover:text-rose-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {localSettings.excludedDomains.length === 0 && (
          <p className="text-[10px] text-slate-500 italic">No domains excluded</p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-2 border-t border-surface-border/50 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          <span>Danger Zone</span>
        </div>

        {showConfirmClear ? (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-2">
            <p className="text-[11px] text-rose-300 font-medium">
              Delete all session history? This cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearAllSessions?.();
                  setShowConfirmClear(false);
                }}
                disabled={isClearing}
                className="flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
              >
                {isClearing ? 'Deleting...' : 'Yes, Delete All'}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-300 hover:bg-surface-secondary border border-surface-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 hover:border-rose-500/30 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Sessions</span>
          </button>
        )}
      </div>
    </div>
  );
};
