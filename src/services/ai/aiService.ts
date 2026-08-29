/**
 * ContextSwitch — AI Service Orchestrator
 * Layer 3: Manages provider selection, privacy sanitization, caching, and analysis lifecycle.
 *
 * Single entry point the UI uses for all AI operations.
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

export const DEFAULT_AI_SETTINGS: AISettings = {
  processingMode: 'local_only',
  excludedDomains: [],
  autoAnalyze: true,
};

class AIService {
  private provider: AIProvider;
  private localFallback: LocalFallbackProvider;
  private geminiProvider: GeminiProvider;
  private settings: AISettings;
  private lastResult: AIContextResult | null = null;
  private lastTabSignature: string = '';
  private analysisInProgress = false;

  constructor() {
    this.localFallback = new LocalFallbackProvider();
    this.geminiProvider = new GeminiProvider();
    this.provider = this.localFallback;
    this.settings = { ...DEFAULT_AI_SETTINGS };
  }

  updateSettings(settings: AISettings): void {
    this.settings = { ...settings };

    if (settings.processingMode === 'cloud_ai') {
      this.provider = this.geminiProvider;
    } else {
      this.provider = this.localFallback;
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  async analyzeCurrentContext(
    tabs: TabItem[],
    switchEvents: ContextSwitchEvent[],
    sessionDurationMinutes: number
  ): Promise<AIContextResult> {
    if (!tabs || tabs.length === 0) {
      return {
        project: 'No Active Context',
        task: 'No open tabs detected',
        confidence: 0,
        category: 'general',
        distraction: false,
        summary: 'No active context detected yet.',
        nextAction: 'Open a tab to begin your workflow.',
        analyzedAt: new Date().toISOString(),
      };
    }

    const currentSignature = this.computeTabSignature(tabs);
    if (
      this.lastResult &&
      currentSignature === this.lastTabSignature &&
      !this.isResultStale(this.lastResult)
    ) {
      return this.lastResult;
    }

    if (this.analysisInProgress && this.lastResult) {
      return this.lastResult;
    }

    this.analysisInProgress = true;

    try {
      const sanitizedTabs = sanitizeTabsForAI(tabs, this.settings.excludedDomains);
      const sanitizedSwitches = sanitizeSwitchEventsForAI(switchEvents);
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
      console.warn('[ContextSwitch] AI analysis error, falling back to local heuristic:', error);

      const sanitizedTabs = sanitizeTabsForAI(tabs, this.settings.excludedDomains);
      const sanitizedSwitches = sanitizeSwitchEventsForAI(switchEvents);
      const dominantCategory = this.getDominantCategory(sanitizedTabs);

      return this.localFallback.analyzeContext({
        tabs: sanitizedTabs,
        recentSwitches: sanitizedSwitches,
        sessionDurationMinutes,
        dominantCategory,
      });
    } finally {
      this.analysisInProgress = false;
    }
  }

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
      console.warn('[ContextSwitch] Summary generation error:', error);
      return 'Session completed with active tabs.';
    }
  }

  invalidateCache(): void {
    this.lastResult = null;
    this.lastTabSignature = '';
  }

  private computeTabSignature(tabs: TabItem[]): string {
    return tabs
      .map(t => `${t.domain}:${t.isActive ? '1' : '0'}`)
      .sort()
      .join('|');
  }

  private isResultStale(result: AIContextResult): boolean {
    const age = Date.now() - new Date(result.analyzedAt).getTime();
    return age > 45000;
  }

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

export const aiService = new AIService();
