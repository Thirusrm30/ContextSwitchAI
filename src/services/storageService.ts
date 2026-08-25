import { ContextState, AISettings } from '../types/context';
import { INITIAL_CONTEXT_STATE } from './mockData';
import { DEFAULT_AI_SETTINGS } from './ai/aiService';

const STORAGE_KEY = 'contextswitch_state_v1';
const AI_SETTINGS_KEY = 'cs_ai_settings_v1';

/**
 * Check if we're running inside a Chrome extension environment.
 */
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
   * Falls back to stored state or mock data when not in extension env.
   */
  async loadLiveContext(): Promise<ContextState> {
    const aiSettings = await this.loadAISettings();

    if (isExtensionEnv()) {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CS_GET_LIVE_STATE' });
        if (response && response.openTabs) {
          // Map the live state to our ContextState shape
          return {
            activeProject: response.activeProject || 'Detecting...',
            currentTask: response.currentTask || 'Analyzing browser activity...',
            contextScore: response.contextScore ?? 0,
            focusState: response.focusState || 'Moderate Focus',
            switchesToday: response.switchesToday ?? 0,
            deepWorkMinutes: response.deepWorkMinutes ?? 0,
            privacyMode: 'local_only',
            openTabs: response.openTabs || [],
            recentSessions: response.recentSessions || INITIAL_CONTEXT_STATE.recentSessions,
            contextSwitchEvents: response.contextSwitchEvents || [],
            tabGroups: response.tabGroups || [],
            sessionStartTime: response.sessionStartTime || new Date().toISOString(),
            lastActivityTime: response.lastActivityTime || new Date().toISOString(),
            aiSettings,
          };
        }
      } catch (e) {
        console.warn('[ContextSwitch] Failed to get live state from service worker:', e);
      }
    }

    // Fallback: try loading from storage, then mock
    const fallbackState = await this.loadState();
    return {
      ...fallbackState,
      aiSettings,
    };
  },

  /**
   * Load context state from Chrome storage or fallback to localStorage
   */
  async loadState(): Promise<ContextState> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
          return result[STORAGE_KEY] as ContextState;
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as ContextState;
        }
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error loading storage:', e);
    }
    
    // Default initial mock state
    return INITIAL_CONTEXT_STATE;
  },

  /**
   * Save context state to Chrome storage or fallback to localStorage
   */
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

  /**
   * Load AI settings from Chrome storage or localStorage
   */
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

  /**
   * Save AI settings to Chrome storage or localStorage
   */
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

  /**
   * Clear all ContextSwitch data from storage.
   */
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
        const all = await chrome.storage.local.get(null);
        const csKeys = Object.keys(all).filter(k => k.startsWith('cs_') || k.startsWith('contextswitch_'));
        if (csKeys.length > 0) {
          await chrome.storage.local.remove(csKeys);
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('cs_') || key.startsWith('contextswitch_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => window.localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('[ContextSwitch] Error clearing storage:', e);
    }
  },

  /**
   * Reset to initial mock dataset
   */
  async resetToMock(): Promise<ContextState> {
    await this.saveState(INITIAL_CONTEXT_STATE);
    return INITIAL_CONTEXT_STATE;
  }
};
