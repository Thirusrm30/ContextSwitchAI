import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { CurrentContextCard } from '../components/CurrentContextCard';
import { ContextScoreGauge } from '../components/ContextScoreGauge';
import { OpenTabsList } from '../components/OpenTabsList';
import { RecentSessions } from '../components/RecentSessions';
import { PrivacyStatusBadge } from '../components/PrivacyStatusBadge';
import { QuickActions } from '../components/QuickActions';
import { ResumeWorkModal } from '../components/ResumeWorkModal';
import { storageService } from '../services/storageService';
import { ContextState, WorkSession } from '../types/context';
import { INITIAL_CONTEXT_STATE } from '../services/mockData';
import { CheckCircle2, Info } from 'lucide-react';

export const SidePanelDashboard: React.FC = () => {
  const [state, setState] = useState<ContextState>(INITIAL_CONTEXT_STATE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSessionForResume, setSelectedSessionForResume] = useState<WorkSession | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    setIsRefreshing(true);
    try {
      const data = await storageService.loadState();
      setState(data);
    } catch (e) {
      console.error('Failed to load state', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleResumePrimary = () => {
    // Pick the most recent non-active session, or default to current
    const targetSession = state.recentSessions.find((s) => !s.isCurrent) || state.recentSessions[0];
    setSelectedSessionForResume(targetSession);
    setIsResumeModalOpen(true);
  };

  const handleResumeSpecificSession = (session: WorkSession) => {
    setSelectedSessionForResume(session);
    setIsResumeModalOpen(true);
  };

  const handleConfirmRestore = async (session: WorkSession) => {
    // Update active project and task to selected session
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

    // If running in Chrome Extension environment, open tabs
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 font-sans">
      {/* 1. Header with Logo & Brand */}
      <Header onRefresh={loadContext} isRefreshing={isRefreshing} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-14 z-40 mx-4 mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
        {/* Quick Context Switch Alert Banner */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
          <Info className="w-4 h-4 text-brand-400 shrink-0" />
          <span>
            Working on <strong>{state.activeProject}</strong>. ContextSwitch is actively tracking your focus state.
          </span>
        </div>

        {/* 7. Resume My Work Primary Hero CTA */}
        <QuickActions
          onResumeClick={handleResumePrimary}
          onSaveSnapshot={handleSaveSnapshot}
          isCurrentActive={true}
        />

        {/* 2, 3, 4, 8. Current Context, Active Project, Current Task & Switching Indicator */}
        <CurrentContextCard
          activeProject={state.activeProject}
          currentTask={state.currentTask}
          durationMinutes={48}
          switchesToday={state.switchesToday}
        />

        {/* 8. Context Score Gauge (87%) */}
        <ContextScoreGauge
          score={state.contextScore}
          focusState={state.focusState}
          switchesCount={state.switchesToday}
        />

        {/* 5. Open Project Tabs (Firebase Docs, GitHub Repo, React Docs, Stack Overflow) */}
        <OpenTabsList tabs={state.openTabs} />

        {/* 6. Recent Sessions */}
        <RecentSessions
          sessions={state.recentSessions}
          onResumeSession={handleResumeSpecificSession}
        />

        {/* 9. Privacy Status */}
        <PrivacyStatusBadge />
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
