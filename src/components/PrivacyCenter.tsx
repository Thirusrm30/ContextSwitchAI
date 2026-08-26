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
  Info,
  Server,
  Cpu,
  Cloud,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { PrivacySettings as PrivacySettingsType } from '../types/context';

interface PrivacyCenterProps {
  settings: PrivacySettingsType;
  onSave: (settings: PrivacySettingsType) => void;
  onClearAllSessions?: () => void;
  isClearing?: boolean;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  settings,
  onSave,
  onClearAllSessions,
  isClearing,
}) => {
  const [localSettings, setLocalSettings] = useState<PrivacySettingsType>({ ...settings });
  const [newDomain, setNewDomain] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const toggle = (key: keyof PrivacySettingsType) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    onSave(updated);
  };

  const addDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain || localSettings.excludedDomains.includes(domain)) return;
    const updated = { ...localSettings, excludedDomains: [...localSettings.excludedDomains, domain] };
    setLocalSettings(updated);
    onSave(updated);
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    const updated = { ...localSettings, excludedDomains: localSettings.excludedDomains.filter((d) => d !== domain) };
    setLocalSettings(updated);
    onSave(updated);
  };

  return (
    <div className="rounded-xl bg-surface-secondary/50 border border-surface-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Privacy Center</h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                Your data never leaves this device
              </p>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Secure
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Data Collection Explanation */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-brand-500/5 border border-brand-500/15 text-left hover:bg-brand-500/10 transition-colors"
        >
          <Info className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-[11px] font-semibold text-brand-300 flex-1">What data is collected & where it is processed</span>
          {showInfo ? <ChevronDown className="w-3.5 h-3.5 text-brand-400" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
        </button>

        {showInfo && (
          <div className="p-3 rounded-lg bg-surface-tertiary/40 border border-surface-border/50 space-y-2.5 text-[11px] text-slate-300 leading-relaxed animate-fadeIn">
            <div className="flex items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Local Processing (Default)</span>
                <span className="text-slate-400">Tab URLs, titles, and domain categories are analyzed on-device using heuristic rules. Nothing is sent anywhere.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Cloud className="w-3.5 h-3.5 text-accent-cyan mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Cloud AI (Optional)</span>
                <span className="text-slate-400">If enabled, only sanitized domain names and tab titles are sent to Google Gemini API for advanced inference. No full URLs, passwords, or personal data.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Server className="w-3.5 h-3.5 text-accent-emerald mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Backend Storage</span>
                <span className="text-slate-400">Optional Node.js backend stores session summaries in MongoDB. All data remains on your infrastructure. No third-party analytics.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HardDrive className="w-3.5 h-3.5 text-accent-amber mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Chrome Storage</span>
                <span className="text-slate-400">Session data, context scores, and preferences are stored in chrome.storage.local — encrypted at rest by Chrome. Never synced to any server.</span>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Mode */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Privacy Mode</span>
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded-lg border text-center transition-all ${
              localSettings.historyEnabled
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                : 'bg-surface-tertiary/40 border-surface-border/50 text-slate-400'
            }`}>
              <HardDrive className="w-4 h-4 mx-auto mb-1" />
              <span className="text-[11px] font-semibold block">Local Only</span>
              <span className="text-[9px] opacity-70">All data on-device</span>
            </div>
            <div className={`p-3 rounded-lg border text-center transition-all ${
              !localSettings.historyEnabled
                ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                : 'bg-surface-tertiary/40 border-surface-border/50 text-slate-400'
            }`}>
              <Cloud className="w-4 h-4 mx-auto mb-1" />
              <span className="text-[11px] font-semibold block">Cloud AI</span>
              <span className="text-[9px] opacity-70">Sanitized AI inference</span>
            </div>
          </div>
        </div>

        {/* Session History Toggle */}
        <div className="space-y-2">
          <button
            onClick={() => toggle('historyEnabled')}
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
            <div className={`w-9 h-5 rounded-full transition-colors relative ${localSettings.historyEnabled ? 'bg-brand-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localSettings.historyEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Clear on Exit Toggle */}
          <button
            onClick={() => toggle('clearAllOnExit')}
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
            <div className={`w-9 h-5 rounded-full transition-colors relative ${localSettings.clearAllOnExit ? 'bg-amber-600' : 'bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localSettings.clearAllOnExit ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Excluded Domains */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Excluded Domains</span>
          </div>
          <p className="text-[10px] text-slate-500">These domains will not be tracked or stored in session history.</p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              placeholder="e.g. netflix.com"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50"
            />
            <button
              onClick={addDomain}
              disabled={!newDomain.trim()}
              className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {localSettings.excludedDomains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {localSettings.excludedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 font-mono"
                >
                  {domain}
                  <button onClick={() => removeDomain(domain)} className="text-rose-400 hover:text-rose-200 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 italic">No domains excluded</p>
          )}
        </div>

        {/* Data Retention */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Retention</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-tertiary/40 border border-surface-border/50 text-[11px] text-slate-400">
            {localSettings.clearAllOnExit
              ? 'All session data is automatically deleted when the browser is closed. History is not preserved.'
              : localSettings.historyEnabled
                ? 'Session data is retained locally until manually cleared. Stored in chrome.storage.local (max ~5MB).'
                : 'No session data is being stored. All tracking is disabled.'}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-2 border-t border-surface-border/50 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" />
            <span>Data Management</span>
          </div>

          {showConfirmClear ? (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-2">
              <p className="text-[11px] text-rose-300 font-medium">
                Delete all session history? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { onClearAllSessions?.(); setShowConfirmClear(false); }}
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
              <span>Delete All Context Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
