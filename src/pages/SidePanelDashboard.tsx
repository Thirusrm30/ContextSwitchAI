import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { CurrentContextCard } from '../components/CurrentContextCard';
import { ContextScoreGauge } from '../components/ContextScoreGauge';
import { OpenTabsList } from '../components/OpenTabsList';
import { RecentSessions } from '../components/RecentSessions';
import { PrivacyStatusBadge } from '../components/PrivacyStatusBadge';
import { QuickActions } from '../components/QuickActions';
import { ResumeWorkModal } from '../components/ResumeWorkModal';
import { ContextSwitchTimeline } from '../components/ContextSwitchTimeline';
import { TabGroupsView } from '../components/TabGroupsView';
import { AIContextCard } from '../components/AIContextCard';
import { DistractionAlert } from '../components/DistractionAlert';
import { AISettingsPanel } from '../components/AISettingsPanel';
import { storageService } from '../services/storageService';
import { aiService } from '../services/ai/aiService';
import { ContextState, WorkSession, AIContextResult, AISettings } from '../types/context';
import { INITIAL_CONTEXT_STATE } from '../services/mockData';
import { CheckCircle2, Wifi, WifiOff } from 'lucide-react';

const POLL_INTERVAL_MS = 3000;

export const SidePanelDashboard: React.FC = () => {
  const [state, setState] = useState<ContextState>(INITIAL_CONTEXT_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSessionForResume, setSelectedSessionForResume] = useState<WorkSession | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // AI State
  const [aiResult, setAiResult] = useState<AIContextResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showDistractionAlert, setShowDistractionAlert] = useState(false);
  const [isBreakMode, setIsBreakMode] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAiAnalysis = useCallback(async (
    currentState: ContextState,
    force = false
  ) => {
    if (!currentState.openTabs || currentState.openTabs.length === 0) return;

    if (force) {
      aiService.invalidateCache();
    }

    setIsAiLoading(true);
    try {
      const sessionDurationMins = currentState.sessionStartTime
        ? Math.floor((Date.now() - new Date(currentState.sessionStartTime).getTime()) / 60000)
        : 0;

      const result = await aiService.analyzeCurrentContext(
        currentState.openTabs,
        currentState.contextSwitchEvents || [],
        sessionDurationMins
      );

      setAiResult(result);

      // Check for distraction alert trigger (if not in break mode)
      if (result.distraction && !isBreakMode) {
        setShowDistractionAlert(true);
      } else if (!result.distraction) {
        setShowDistractionAlert(false);
      }
    } catch (e) {
      console.warn('[ContextSwitch] AI analysis failed in dashboard:', e);
    } finally {
      setIsAiLoading(false);
    }
  }, [isBreakMode]);

  const loadContext = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await storageService.loadLiveContext();
      setState(data);

      // Sync AI settings with aiService
      if (data.aiSettings) {
        aiService.updateSettings(data.aiSettings);
      }

      // Detect if we're getting live data (has real tabs with numeric IDs)
      const hasLiveTabs = data.openTabs.some(t => typeof t.id === 'number');
      setIsLive(hasLiveTabs);

      // Run AI analysis
      runAiAnalysis(data);
    } catch (e) {
      console.error('Failed to load context', e);
      setIsLive(false);
    } finally {
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, [runAiAnalysis]);

  // Initial load + polling
  useEffect(() => {
    loadContext(true);

    pollRef.current = setInterval(() => {
      loadContext(false);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadContext]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleResumePrimary = () => {
    const targetSession = state.recentSessions.find((s) => !s.isCurrent) || state.recentSessions[0];
    if (targetSession) {
      setSelectedSessionForResume(targetSession);
      setIsResumeModalOpen(true);
    }
  };

  const handleResumeSpecificSession = (session: WorkSession) => {
    setSelectedSessionForResume(session);
    setIsResumeModalOpen(true);
  };

  const handleConfirmRestore = async (session: WorkSession) => {
    const updatedSessions = state.recentSessions.map((s) => ({
      ...s,
      isCurrent: s.id === session.id,
    }));

    const newState: ContextState = {
      ...state,
      activeProject: session.projectName,
      currentTask: session.currentTask,
      contextScore: session.contextScore,
      openTabs: session.openTabs,
      recentSessions: updatedSessions,
    };

    setState(newState);
    await storageService.saveState(newState);
    setIsResumeModalOpen(false);

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      session.openTabs.forEach((tab) => {
        chrome.tabs.create({ url: tab.url, active: false });
      });
    }

    showToast(`Restored context: "${session.projectName}" (${session.openTabs.length} tabs)`);
  };

  const handleSaveSnapshot = async () => {
    showToast(`Context snapshot saved: ${state.activeProject}`);
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await storageService.clearAllData();
      setAiResult(null);
      setShowDistractionAlert(false);
      showToast('All context data cleared successfully');
      await loadContext(true);
    } catch (e) {
      console.error('Failed to clear data', e);
      showToast('Failed to clear context data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveAISettings = async (newSettings: AISettings) => {
    await storageService.saveAISettings(newSettings);
    aiService.updateSettings(newSettings);
    setState(prev => ({ ...prev, aiSettings: newSettings }));
    showToast(`AI mode set to: ${newSettings.processingMode === 'cloud_ai' ? 'Cloud AI' : 'Local Only'}`);
    runAiAnalysis(state, true);
  };

  const handleContinueWorking = () => {
    setShowDistractionAlert(false);
    showToast('Focus reaffirmed. Keep going!');
  };

  const handleTakeBreak = () => {
    setShowDistractionAlert(false);
    setIsBreakMode(true);
    showToast('Break mode enabled. Take your time!');
  };

  // Compute derived values
  const activeTab = state.openTabs.find(t => t.isActive) || null;
  const sessionDurationMinutes = state.sessionStartTime
    ? Math.floor((Date.now() - new Date(state.sessionStartTime).getTime()) / 60000)
    : 0;

  // Use AI project & task if available, otherwise fall back to heuristic
  const displayProject = aiResult?.project && aiResult.project !== 'Unknown'
    ? aiResult.project
    : state.activeProject;

  const displayTask = aiResult?.task && aiResult.task !== 'Analysis failed'
    ? aiResult.task
    : state.currentTask;

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 font-sans">
      {/* 1. Header with Logo & Brand */}
      <Header onRefresh={() => loadContext(true)} isRefreshing={isRefreshing} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-14 z-40 mx-4 mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
        {/* Live / Fallback Status Banner */}
        <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
          isLive
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            : 'bg-brand-500/10 border border-brand-500/20 text-brand-300'
        }`}>
          {isLive ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Live Tracking Active</strong> — Monitoring {state.openTabs.length} tabs across {state.tabGroups?.length || 0} groups.
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-brand-400 shrink-0" />
              <span>
                <strong>Preview Mode</strong> — Load as extension for live browser tracking. Showing mock data.
              </span>
            </>
          )}
        </div>

        {/* Non-blocking Distraction Alert */}
        <DistractionAlert
          isOpen={showDistractionAlert}
          reason={aiResult?.distractionReason}
          currentTask={displayTask}
          onContinueWorking={handleContinueWorking}
          onTakeBreak={handleTakeBreak}
          onDismiss={() => setShowDistractionAlert(false)}
        />

        {/* 🧠 Layer 3 AI Context Card */}
        <AIContextCard
          aiResult={aiResult}
          isLoading={isAiLoading}
          providerName={aiService.getProviderName()}
          onReanalyze={() => runAiAnalysis(state, true)}
        />

        {/* Resume My Work Primary Hero CTA */}
        <QuickActions
          onResumeClick={handleResumePrimary}
          onSaveSnapshot={handleSaveSnapshot}
          isCurrentActive={true}
        />

        {/* Current Context, Active Project, Current Task & Switching Indicator */}
        <CurrentContextCard
          activeProject={displayProject}
          currentTask={displayTask}
          durationMinutes={sessionDurationMinutes}
          switchesToday={state.switchesToday}
          activeTab={activeTab}
        />

        {/* Context Score Gauge */}
        <ContextScoreGauge
          score={state.contextScore}
          focusState={state.focusState}
          switchesCount={state.switchesToday}
        />

        {/* Auto-Detected Tab Groups */}
        {state.tabGroups && state.tabGroups.length > 0 && (
          <TabGroupsView groups={state.tabGroups} />
        )}

        {/* Open Project Tabs */}
        <OpenTabsList tabs={state.openTabs} />

        {/* Context Switch Timeline */}
        <ContextSwitchTimeline events={state.contextSwitchEvents || []} />

        {/* Recent Sessions */}
        {state.recentSessions.length > 0 && (
          <RecentSessions
            sessions={state.recentSessions}
            onResumeSession={handleResumeSpecificSession}
          />
        )}

        {/* AI Processing Settings */}
        <AISettingsPanel
          settings={state.aiSettings || aiService.getSettings()}
          onSaveSettings={handleSaveAISettings}
        />

        {/* Privacy Status with Clear Data */}
        <PrivacyStatusBadge
          onClearData={handleClearData}
          isClearing={isClearing}
        />
      </main>

      {/* Restore Work Modal */}
      <ResumeWorkModal
        session={selectedSessionForResume}
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onConfirmRestore={handleConfirmRestore}
      />
    </div>
  );
};
