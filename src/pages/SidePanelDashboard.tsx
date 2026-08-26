import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header';
import { CurrentContextCard } from '../components/CurrentContextCard';
import { ContextScoreGauge } from '../components/ContextScoreGauge';
import { OpenTabsList } from '../components/OpenTabsList';
import { RecentSessions } from '../components/RecentSessions';
import { PrivacySettingsPanel } from '../components/PrivacySettings';
import { QuickActions } from '../components/QuickActions';
import { ResumeWorkModal } from '../components/ResumeWorkModal';
import { ContextSwitchTimeline } from '../components/ContextSwitchTimeline';
import { TabGroupsView } from '../components/TabGroupsView';
import { AIContextCard } from '../components/AIContextCard';
import { DistractionAlert } from '../components/DistractionAlert';
import { AISettingsPanel } from '../components/AISettingsPanel';
import { ContextHistory } from '../components/ContextHistory';
import { SessionTimeline } from '../components/SessionTimeline';
import { storageService } from '../services/storageService';
import { aiService } from '../services/ai/aiService';
import {
  ContextState,
  WorkSession,
  AIContextResult,
  AISettings,
  ProjectHistory,
  PrivacySettings as PrivacySettingsType,
} from '../types/context';
import {
  INITIAL_CONTEXT_STATE,
  DEFAULT_PRIVACY_SETTINGS,
} from '../services/mockData';
import { CheckCircle2, Wifi, WifiOff, Eye } from 'lucide-react';

const POLL_INTERVAL_MS = 3000;

export const SidePanelDashboard: React.FC = () => {
  const [state, setState] = useState<ContextState>(INITIAL_CONTEXT_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSessionForResume, setSelectedSessionForResume] = useState<WorkSession | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [summaryModalSession, setSummaryModalSession] = useState<WorkSession | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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

      if (data.aiSettings) {
        aiService.updateSettings(data.aiSettings);
      }

      const hasLiveTabs = data.openTabs.some(t => typeof t.id === 'number');
      setIsLive(hasLiveTabs);

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

  const handleResumeProject = (project: ProjectHistory) => {
    if (project.sessions.length > 0) {
      setSelectedSessionForResume(project.sessions[0]);
      setIsResumeModalOpen(true);
    } else {
      showToast(`Resume not available for "${project.projectName}" — no saved sessions.`);
    }
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

  const handleDeleteSession = async (session: WorkSession) => {
    const updatedSessions = state.recentSessions.filter((s) => s.id !== session.id);
    const newState: ContextState = { ...state, recentSessions: updatedSessions };
    setState(newState);
    await storageService.saveState(newState);
    showToast(`Deleted session: "${session.projectName}"`);
  };

  const handleViewSummary = (session: WorkSession) => {
    setSummaryModalSession(session);
    setShowSummaryModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    const updatedProjects = (state.projectHistory || []).filter((p) => p.id !== projectId);
    const newState: ContextState = { ...state, projectHistory: updatedProjects };
    setState(newState);
    await storageService.saveState(newState);
    showToast('Project removed from history');
  };

  const handleSavePrivacySettings = async (newSettings: PrivacySettingsType) => {
    const newState: ContextState = { ...state, privacySettings: newSettings };
    setState(newState);
    await storageService.saveState(newState);
    showToast('Privacy settings updated');
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

  const activeTab = state.openTabs.find(t => t.isActive) || null;
  const sessionDurationMinutes = state.sessionStartTime
    ? Math.floor((Date.now() - new Date(state.sessionStartTime).getTime()) / 60000)
    : 0;

  const displayProject = aiResult?.project && aiResult.project !== 'Unknown'
    ? aiResult.project
    : state.activeProject;

  const displayTask = aiResult?.task && aiResult.task !== 'Analysis failed'
    ? aiResult.task
    : state.currentTask;

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 font-sans">
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

        {/* AI Context Card */}
        <AIContextCard
          aiResult={aiResult}
          isLoading={isAiLoading}
          providerName={aiService.getProviderName()}
          onReanalyze={() => runAiAnalysis(state, true)}
        />

        {/* Resume My Work Hero CTA */}
        <QuickActions
          onResumeClick={handleResumePrimary}
          onSaveSnapshot={handleSaveSnapshot}
          isCurrentActive={true}
        />

        {/* Current Context */}
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

        {/* Tab Groups */}
        {state.tabGroups && state.tabGroups.length > 0 && (
          <TabGroupsView groups={state.tabGroups} />
        )}

        {/* Open Tabs */}
        <OpenTabsList tabs={state.openTabs} />

        {/* Context Switch Timeline */}
        <ContextSwitchTimeline events={state.contextSwitchEvents || []} />

        {/* Recent Sessions */}
        {state.recentSessions.length > 0 && (
          <RecentSessions
            sessions={state.recentSessions}
            onResumeSession={handleResumeSpecificSession}
            onDeleteSession={handleDeleteSession}
            onViewSummary={handleViewSummary}
          />
        )}

        {/* Context History (Recent Work by Project) */}
        {state.projectHistory && state.projectHistory.length > 0 && (
          <ContextHistory
            projects={state.projectHistory}
            onResumeProject={handleResumeProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {/* AI Processing Settings */}
        <AISettingsPanel
          settings={state.aiSettings || aiService.getSettings()}
          onSaveSettings={handleSaveAISettings}
        />

        {/* Privacy Settings */}
        <PrivacySettingsPanel
          settings={state.privacySettings || DEFAULT_PRIVACY_SETTINGS}
          onSave={handleSavePrivacySettings}
          onClearAllSessions={handleClearData}
          isClearing={isClearing}
        />
      </main>

      {/* Resume Work Modal */}
      <ResumeWorkModal
        session={selectedSessionForResume}
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onConfirmRestore={handleConfirmRestore}
        onViewSummary={handleViewSummary}
        onDeleteSession={(session) => {
          handleDeleteSession(session);
          setIsResumeModalOpen(false);
        }}
      />

      {/* Session Summary Modal */}
      {showSummaryModal && summaryModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-surface-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Session Summary
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {summaryModalSession.projectName} — {summaryModalSession.currentTask}
                  </p>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-surface-secondary transition-colors"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {/* AI Summary */}
              <div className="p-3 rounded-xl bg-surface-secondary/70 border border-surface-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block mb-1">
                  AI Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {summaryModalSession.summary}
                </p>
              </div>

              {/* Suggested Next Step */}
              {summaryModalSession.suggestedNextStep && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-brand-500/15 to-accent-violet/10 border border-brand-500/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 block mb-1">
                    Suggested Next Step
                  </span>
                  <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                    {summaryModalSession.suggestedNextStep}
                  </p>
                </div>
              )}

              {/* Unfinished Work */}
              {summaryModalSession.unfinishedWork && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Unfinished Work
                  </span>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    {summaryModalSession.unfinishedWork}
                  </p>
                </div>
              )}

              {/* Session Timeline */}
              {summaryModalSession.timeline && summaryModalSession.timeline.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Session Timeline
                  </span>
                  <div className="p-3 rounded-xl bg-surface-secondary/40 border border-surface-border/50">
                    <SessionTimeline events={summaryModalSession.timeline} />
                  </div>
                </div>
              )}

              {/* Tabs List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tabs in Session ({summaryModalSession.openTabs.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {summaryModalSession.openTabs.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 rounded bg-surface-tertiary/60 text-[11px] border border-surface-border/50"
                    >
                      <span className="truncate text-slate-200">{t.title}</span>
                      <span className="text-slate-500 shrink-0 ml-2 font-mono text-[10px]">{t.domain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-surface-border bg-surface-secondary/30">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surface-secondary border border-surface-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
