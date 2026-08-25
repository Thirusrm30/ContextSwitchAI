import React, { useState } from 'react';
import { Sliders, Cpu, Cloud, Key, Shield, ChevronDown, ChevronRight, Check, Eye, EyeOff, Plus, X } from 'lucide-react';
import { AISettings, AIProcessingMode } from '../types/context';

interface AISettingsPanelProps {
  settings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIProcessingMode>(settings.processingMode);
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [newExcludedDomain, setNewExcludedDomain] = useState('');
  const [excludedDomains, setExcludedDomains] = useState<string[]>(settings.excludedDomains || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    const updated: AISettings = {
      ...settings,
      processingMode: mode,
      apiKey: apiKey.trim() || undefined,
      excludedDomains,
    };
    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newExcludedDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (domain && !excludedDomains.includes(domain)) {
      setExcludedDomains([...excludedDomains, domain]);
      setNewExcludedDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setExcludedDomains(excludedDomains.filter(d => d !== domain));
  };

  return (
    <div className="rounded-xl bg-surface-secondary/70 border border-surface-border overflow-hidden transition-all">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">AI Processing & Privacy</h4>
            <p className="text-[10px] text-slate-400">
              Mode: <span className="font-semibold text-brand-300 capitalize">{mode.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Settings Content */}
      {isOpen && (
        <div className="p-3.5 border-t border-surface-border/60 space-y-3.5 bg-surface/40">
          {/* Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">
              AI Processing Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('local_only')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  mode === 'local_only'
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm'
                    : 'bg-surface-secondary text-slate-400 border-surface-border hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Local Only</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('cloud_ai')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  mode === 'cloud_ai'
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm'
                    : 'bg-surface-secondary text-slate-400 border-surface-border hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud AI (Gemini)</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              {mode === 'local_only'
                ? '• 100% on-device heuristic inference. Zero data sent to the cloud.'
                : '• High-accuracy LLM inference. Only sanitized domain + title sent.'}
            </p>
          </div>

          {/* Cloud API Key Input (if cloud mode) */}
          {mode === 'cloud_ai' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] text-slate-400 font-normal">AI_API_KEY</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Gemini API Key"
                  className="w-full bg-surface-tertiary border border-surface-border rounded-lg py-1.5 pl-8 pr-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Google AI Studio</a>. Saved locally in browser storage.
              </p>
            </div>
          )}

          {/* Excluded Domains */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Excluded Domains from AI Analysis</span>
            </label>

            <form onSubmit={handleAddDomain} className="flex gap-1.5">
              <input
                type="text"
                value={newExcludedDomain}
                onChange={(e) => setNewExcludedDomain(e.target.value)}
                placeholder="e.g. internal.company.com"
                className="flex-1 bg-surface-tertiary border border-surface-border rounded-lg py-1 px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-surface-tertiary hover:bg-surface-border text-slate-200 text-xs font-semibold flex items-center gap-1 border border-surface-border"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* List of excluded domains */}
            {excludedDomains.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {excludedDomains.map((dom) => (
                  <span
                    key={dom}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-tertiary border border-surface-border text-[10px] text-slate-300"
                  >
                    <span>{dom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(dom)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Apply & Save AI Settings</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
