/**
 * ContextSwitch — Storage & State Service
 * Manages live context communication with Chrome extension service worker,
 * local storage caching, and backend API synchronization.
 * Zero mock data.
 */

import { ContextState, AISettings, PrivacySettings, WorkSession } from '../types/context';
import { EMPTY_CONTEXT_STATE, DEFAULT_PRIVACY_SETTINGS } from './defaults';
import { DEFAULT_AI_SETTINGS } from './ai/aiService';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'cs_live_context_v2';
const AI_SETTINGS_KEY = 'cs_ai_settings_v1';
const PRIVACY_SETTINGS_KEY = 'cs_privacy_settings';

function isExtensionEnv(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.runtime &&
    !!chrome.runtime.sendMessage
  );
}

export const storageService = {
  /**
   * Load live context state from the background service worker.
   * Merges real MongoDB backend sessions and projects when available.
   */
  async loadLiveContext(): Promise<ContextState> {
    const aiSettings = await this.loadAISettings();
    const privacySettings = await this.loadPrivacySettings();

    let baseState: ContextState = { ...EMPTY_CONTEXT_STATE, aiSettings, privacySettings };

    // 1. If in Chrome Extension environment, fetch real-time tab state
    if (isExtensionEnv()) {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CS_GET_LIVE_STATE' });
        if (response && response.openTabs) {
          baseState = {
            ...baseState,
            activeProject: response.activeProject || (response.openTabs.length > 0 ? 'Active Session' : 'No Active Context'),
            currentTask: response.currentTask || (response.openTabs.length > 0 ? response.openTabs[0].title : 'No active tabs'),
            contextScore: response.contextScore ?? 0,
            focusState: response.focusState || 'Moderate Focus',
            switchesToday: response.switchesToday ?? 0,
            deepWorkMinutes: response.deepWorkMinutes ?? 0,
            privacyMode: 'local_only',
            openTabs: response.openTabs || [],
            recentSessions: response.recentSessions || [],
            contextSwitchEvents: response.contextSwitchEvents || [],
            tabGroups: response.tabGroups || [],
            sessionStartTime: response.sessionStartTime || new Date().toISOString(),
            lastActivityTime: response.lastActivityTime || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('[ContextSwitch] Service worker query failed:', e);
      }
    } else {
      // In standalone browser preview, load from localStorage
      const cached = await this.loadState();
      baseState = {
        ...cached,
        aiSettings,
        privacySettings,
      };
    }

    // 2. Fetch real sessions and projects from MongoDB backend
    try {
      const isHealthy = await apiClient.checkHealth();
      if (isHealthy) {
        const [dbSessions, dbProjects] = await Promise.all([
          apiClient.getSessions(15),
          apiClient.getProjects()
        ]);

        if (dbSessions.length > 0) {
          // Merge db sessions with live local sessions (de-duplicate by id)
          const sessionMap = new Map<string, WorkSession>();
          for (const s of baseState.recentSessions) sessionMap.set(s.id, s);
          for (const s of dbSessions) {
            if (!sessionMap.has(s.id)) sessionMap.set(s.id, s);
          }
          baseState.recentSessions = Array.from(sessionMap.values()).slice(0, 20);
        }

        if (dbProjects.length > 0) {
          baseState.projectHistory = dbProjects;
        }
      }
    } catch (e) {
      console.warn('[ContextSwitch] Backend sync skipped:', e);
    }

    return baseState;
  },

  async loadState(): Promise<ContextState> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
          return { ...EMPTY_CONTEXT_STATE, ...(result[STORAGE_KEY] as ContextState) };
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...EMPTY_CONTEXT_STATE, ...JSON.parse(stored) as ContextState };
        }
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error loading storage:', e);
    }
    return EMPTY_CONTEXT_STATE;
  },

  async saveState(state: ContextState): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: state });
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error saving storage:', e);
    }
  },

  async saveSnapshot(summary?: string): Promise<WorkSession | null> {
    if (isExtensionEnv()) {
      try {
        const res = await chrome.runtime.sendMessage({ type: 'CS_SAVE_SNAPSHOT', summary });
        return res?.session || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (isExtensionEnv()) {
      try {
        await chrome.runtime.sendMessage({ type: 'CS_DELETE_SESSION', sessionId });
      } catch {}
    }
    await apiClient.deleteSession(sessionId);
  },

  async loadAISettings(): Promise<AISettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
        if (result[AI_SETTINGS_KEY]) {
          return result[AI_SETTINGS_KEY] as AISettings;
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(AI_SETTINGS_KEY);
        if (stored) {
          return JSON.parse(stored) as AISettings;
        }
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error loading AI settings:', e);
    }
    return DEFAULT_AI_SETTINGS;
  },

  async saveAISettings(settings: AISettings): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [AI_SETTINGS_KEY]: settings });
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error saving AI settings:', e);
    }
  },

  async loadPrivacySettings(): Promise<PrivacySettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(PRIVACY_SETTINGS_KEY);
        if (result[PRIVACY_SETTINGS_KEY]) {
          return result[PRIVACY_SETTINGS_KEY] as PrivacySettings;
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(PRIVACY_SETTINGS_KEY);
        if (stored) {
          return JSON.parse(stored) as PrivacySettings;
        }
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error loading privacy settings:', e);
    }
    return DEFAULT_PRIVACY_SETTINGS;
  },

  async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [PRIVACY_SETTINGS_KEY]: settings });
        await chrome.runtime.sendMessage({
          type: 'CS_UPDATE_EXCLUDED_DOMAINS',
          excludedDomains: settings.excludedDomains || []
        }).catch(() => {});
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error saving privacy settings:', e);
    }
  },

  async clearAllData(): Promise<void> {
    if (isExtensionEnv()) {
      try {
        await chrome.runtime.sendMessage({ type: 'CS_CLEAR_CONTEXT_DATA' });
      } catch (e) {
        console.warn('[ContextSwitch] Clear via message failed:', e);
      }
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.clear();
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error clearing storage:', e);
    }
  },
};
