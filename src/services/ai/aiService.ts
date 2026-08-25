/**
 * ContextSwitch — AI Service Orchestrator
 * Layer 3: Manages provider selection, privacy sanitization, caching, and analysis lifecycle.
 *
 * This is the single entry point the UI uses for all AI operations.
 */

import { AIProvider } from './aiProvider';
import { LocalFallbackProvider } from './localFallbackProvider';
import { GeminiProvider } from './geminiProvider';
import {
  TabItem,
  ContextSwitchEvent,
  AIContextResult,
  AISettings,
  AIAnalysisInput,
  AISummaryInput,
  DomainCategory,
} from '../../types/context';
import { sanitizeTabsForAI, sanitizeSwitchEventsForAI } from '../privacySanitizer';
import { categorizeDomain } from '../contextEngine';

// ─── Default AI Settings ───

export const DEFAULT_AI_SETTINGS: AISettings = {
  processingMode: 'local_only',
  excludedDomains: [],
  autoAnalyze: true,
};

// ─── AI Service Singleton ───

class AIService {
  private provider: AIProvider;
  private localFallback: LocalFallbackProvider;
  private settings: AISettings;
  private lastResult: AIContextResult | null = null;
  private lastTabSignature: string = '';
  private analysisInProgress = false;

  constructor() {
    this.localFallback = new LocalFallbackProvider();
    this.provider = this.localFallback;
    this.settings = { ...DEFAULT_AI_SETTINGS };
  }

  /**
   * Update settings and select the appropriate AI provider.
   */
  updateSettings(settings: AISettings): void {
    this.settings = { ...settings };

    if (settings.processingMode === 'cloud_ai' && settings.apiKey) {
      this.provider = new GeminiProvider(settings.apiKey);
    } else {
      this.provider = this.localFallback;
    }
  }

  /**
   * Get the current provider name for UI display.
   */
  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Get the current settings.
   */
  getSettings(): AISettings {
    return { ...this.settings };
  }

  /**
   * Analyze the current browser context.
   * Returns cached result if tabs haven't changed significantly.
   */
  async analyzeCurrentContext(
    tabs: TabItem[],
    switchEvents: ContextSwitchEvent[],
    sessionDurationMinutes: number
  ): Promise<AIContextResult> {
    // Check if we should re-analyze (tabs changed significantly)
    const currentSignature = this.computeTabSignature(tabs);
    if (
      this.lastResult &&
      currentSignature === this.lastTabSignature &&
      !this.isResultStale(this.lastResult)
    ) {
      return this.lastResult;
    }

    // Prevent concurrent analysis
    if (this.analysisInProgress && this.lastResult) {
      return this.lastResult;
    }

    this.analysisInProgress = true;

    try {
      // Privacy sanitization
      const sanitizedTabs = sanitizeTabsForAI(tabs, this.settings.excludedDomains);
      const sanitizedSwitches = sanitizeSwitchEventsForAI(switchEvents);

      // Compute dominant category
      const dominantCategory = this.getDominantCategory(sanitizedTabs);

      const input: AIAnalysisInput = {
        tabs: sanitizedTabs,
        recentSwitches: sanitizedSwitches,
        sessionDurationMinutes,
        dominantCategory,
      };

      const result = await this.provider.analyzeContext(input);

      this.lastResult = result;
      this.lastTabSignature = currentSignature;

      return result;
    } catch (error) {
      console.error('[ContextSwitch] AI analysis error:', error);

      // Emergency fallback to local
      if (this.provider !== this.localFallback) {
        const sanitizedTabs = sanitizeTabsForAI(tabs, this.settings.excludedDomains);
        const sanitizedSwitches = sanitizeSwitchEventsForAI(switchEvents);
        const dominantCategory = this.getDominantCategory(sanitizedTabs);

        return this.localFallback.analyzeContext({
          tabs: sanitizedTabs,
          recentSwitches: sanitizedSwitches,
          sessionDurationMinutes,
          dominantCategory,
        });
      }

      // Return a safe default
      return {
        project: 'Unknown',
        task: 'Analysis failed',
        confidence: 0,
        category: 'general',
        distraction: false,
        summary: 'Unable to analyze context.',
        nextAction: 'Continue your current activity.',
        analyzedAt: new Date().toISOString(),
      };
    } finally {
      this.analysisInProgress = false;
    }
  }

  /**
   * Generate a session summary.
   */
  async generateSessionSummary(
    tabs: TabItem[],
    sessionDurationMinutes: number,
    switchCount: number
  ): Promise<string> {
    try {
      const sanitizedTabs = sanitizeTabsForAI(tabs, this.settings.excludedDomains);
      const dominantCategory = this.getDominantCategory(sanitizedTabs);

      const input: AISummaryInput = {
        tabs: sanitizedTabs,
        sessionDurationMinutes,
        switchCount,
        dominantCategory,
      };

      return await this.provider.generateSummary(input);
    } catch (error) {
      console.error('[ContextSwitch] Summary generation error:', error);
      return 'Unable to generate session summary.';
    }
  }

  /**
   * Force re-analysis on next call (clear cache).
   */
  invalidateCache(): void {
    this.lastResult = null;
    this.lastTabSignature = '';
  }

  // ─── Internal Helpers ───

  /**
   * Create a signature string from tabs to detect significant changes.
   * Only re-analyzes when domains or active tab changes.
   */
  private computeTabSignature(tabs: TabItem[]): string {
    const parts = tabs
      .map(t => `${t.domain}:${t.isActive ? '1' : '0'}`)
      .sort()
      .join('|');
    return parts;
  }

  /**
   * Check if a cached result is too old (>60 seconds).
   */
  private isResultStale(result: AIContextResult): boolean {
    const age = Date.now() - new Date(result.analyzedAt).getTime();
    return age > 60000;
  }

  /**
   * Find the dominant category among sanitized tabs.
   */
  private getDominantCategory(
    tabs: Array<{ domain: string; domainCategory: DomainCategory }>
  ): DomainCategory {
    if (tabs.length === 0) return 'general';

    const counts = new Map<DomainCategory, number>();
    for (const t of tabs) {
      const cat = t.domainCategory || categorizeDomain(t.domain);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }

    let maxCount = 0;
    let dominant: DomainCategory = 'general';
    for (const [cat, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = cat;
      }
    }

    return dominant;
  }
}

// Export singleton instance
export const aiService = new AIService();
