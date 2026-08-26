import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Monitor,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { DEMO_SCENARIO, getDemoContextState } from '../services/demoData';
import { ContextState } from '../types/context';
import { ContextScoreGauge } from './ContextScoreGauge';
import { CurrentContextCard } from './CurrentContextCard';
import { OpenTabsList } from './OpenTabsList';
import { TabItem } from '../types/context';

interface DemoModeProps {
  onEnterDemoMode: (state: ContextState) => void;
  onExitDemoMode: () => void;
}

export const DemoMode: React.FC<DemoModeProps> = ({
  onEnterDemoMode,
  onExitDemoMode,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showScenario, setShowScenario] = useState(false);

  const step = DEMO_SCENARIO[currentStep];
  const totalSteps = DEMO_SCENARIO.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const applyStep = useCallback((stepIdx: number) => {
    const s = DEMO_SCENARIO[stepIdx];
    const baseState = getDemoContextState();
    const demoState: ContextState = {
      ...baseState,
      openTabs: s.tabs,
      activeProject: s.project,
      currentTask: s.task,
      contextScore: s.score,
      focusState: s.focusState,
      tabGroups: s.tabs.length > 0
        ? [{ groupName: 'Development', tabs: s.tabs, primaryCategory: 'development', confidence: Math.min(95, 60 + s.tabs.length * 8) }]
        : [],
    };
    onEnterDemoMode(demoState);
  }, [onEnterDemoMode]);

  useEffect(() => {
    if (!isAutoPlaying || !showScenario) return;
    if (isLastStep) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, isLastStep, showScenario]);

  useEffect(() => {
    if (showScenario) {
      applyStep(currentStep);
    }
  }, [currentStep, showScenario, applyStep]);

  const handleStart = () => {
    setShowScenario(true);
    setCurrentStep(0);
    setIsAutoPlaying(true);
    applyStep(0);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsAutoPlaying(false);
    setShowScenario(false);
    onExitDemoMode();
  };

  const handlePrev = () => {
    if (!isFirstStep) setCurrentStep((p) => p - 1);
  };

  const handleNext = () => {
    if (!isLastStep) setCurrentStep((p) => p + 1);
  };

  if (!showScenario) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-brand-600/20 via-accent-violet/10 to-surface border border-brand-500/30 p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-violet shadow-lg shadow-brand-500/25 ring-1 ring-white/10">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Interactive Demo
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Walk through the full ContextSwitch workflow
            </p>
          </div>
        </div>

        <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
          <p>This demo simulates a real work session:</p>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Open GitHub, Firebase Docs, Stack Overflow, localhost</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>ContextSwitch detects <strong className="text-white">Smart Civic Reporter</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Session is saved automatically</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Click <strong className="text-brand-300">Resume My Work</strong> to restore everything</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:from-brand-500 hover:to-accent-violet/90 shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Demo Walkthrough</span>
        </button>
      </div>
    );
  }

  const demoState = getDemoContextState();
  const activeTab = step.tabs.find((t: TabItem) => t.isActive) || null;
  const durationMinutes = Math.floor((Date.now() - new Date(demoState.sessionStartTime).getTime()) / 60000);

  return (
    <div className="space-y-4">
      {/* Demo Controls Bar */}
      <div className="rounded-xl bg-surface-secondary/70 border border-brand-500/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-300">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-white block">Demo Walkthrough</span>
              <span className="text-[10px] text-slate-400">Step {currentStep + 1} of {totalSteps}</span>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Exit demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1">
          {DEMO_SCENARIO.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentStep(idx); setIsAutoPlaying(false); }}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-brand-500'
                  : idx < currentStep
                    ? 'bg-brand-500/40'
                    : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step Title & Description */}
        <div className="p-2.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-brand-400" />
            <span className="text-[11px] font-bold text-white">{step.title}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{step.description}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className="p-1.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isAutoPlaying
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
            }`}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : isLastStep ? (
              <>
                <RotateCcw className="w-3 h-3" />
                <span>Restart</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Auto Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={isLastStep}
            className="p-1.5 rounded-lg bg-surface-tertiary/60 border border-surface-border/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Last step — Resume CTA */}
        {isLastStep && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-brand-500/15 to-accent-violet/10 border border-brand-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider">Resume My Work</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              All tabs restored. You were working on <strong>Firebase Authentication</strong> for the Smart Civic Reporter project.
            </p>
          </div>
        )}
      </div>

      {/* Live Preview of current step state */}
      <div className="space-y-3 rounded-xl bg-surface-secondary/30 border border-surface-border/50 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <FolderKanban className="w-3 h-3" />
          Live State Preview
        </div>

        <CurrentContextCard
          activeProject={step.project}
          currentTask={step.task}
          durationMinutes={durationMinutes}
          switchesToday={Math.max(0, currentStep)}
          activeTab={activeTab}
        />

        <ContextScoreGauge
          score={step.score}
          focusState={step.focusState}
          switchesCount={Math.max(0, currentStep)}
        />

        {step.tabs.length > 0 && (
          <OpenTabsList tabs={step.tabs} />
        )}
      </div>
    </div>
  );
};
