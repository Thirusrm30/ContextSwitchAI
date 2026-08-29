/**
 * ContextSwitch — Default State Constants
 * These are empty/zero-value defaults used when no real data is available.
 * NO mock data, NO demo projects, NO fake sessions.
 */

import { ContextState, PrivacySettings } from '../types/context';

export const EMPTY_CONTEXT_STATE: ContextState = {
  activeProject: '',
  currentTask: '',
  contextScore: 0,
  focusState: 'Moderate Focus',
  switchesToday: 0,
  deepWorkMinutes: 0,
  privacyMode: 'local_only',
  openTabs: [],
  recentSessions: [],
  contextSwitchEvents: [],
  tabGroups: [],
  sessionStartTime: new Date().toISOString(),
  lastActivityTime: new Date().toISOString(),
  projectHistory: [],
  privacySettings: {
    historyEnabled: true,
    excludedDomains: [],
    deleteSessionOnDemand: true,
    clearAllOnExit: false,
  },
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  historyEnabled: true,
  excludedDomains: [],
  deleteSessionOnDemand: true,
  clearAllOnExit: false,
};
