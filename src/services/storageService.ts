import { ContextState } from '../types/context';
import { INITIAL_CONTEXT_STATE } from './mockData';

const STORAGE_KEY = 'contextswitch_state_v1';

export const storageService = {
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
   * Reset to initial mock dataset
   */
  async resetToMock(): Promise<ContextState> {
    await this.saveState(INITIAL_CONTEXT_STATE);
    return INITIAL_CONTEXT_STATE;
  }
};
