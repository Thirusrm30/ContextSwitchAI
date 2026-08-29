/**
 * ContextSwitch — Gemini AI Provider
 * Layer 3: Cloud AI analysis routed securely via Backend API.
 *
 * Sends sanitized browser context (domain + title only) to the backend
 * AI endpoint, protecting API keys from exposure in browser client code.
 *
 * Automatically falls back to LocalFallbackProvider on any error or if backend is offline.
 */

import { AIProvider } from './aiProvider';
import { LocalFallbackProvider } from './localFallbackProvider';
import { AIContextResult, AIAnalysisInput, AISummaryInput } from '../../types/context';
import { apiClient } from '../apiClient';

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini 2.0 Flash (Backend Cloud)';
  readonly requiresApiKey = false; // API Key is securely kept on backend

  private fallback: LocalFallbackProvider;

  constructor() {
    this.fallback = new LocalFallbackProvider();
  }

  async analyzeContext(input: AIAnalysisInput): Promise<AIContextResult> {
    try {
      const result = await apiClient.analyzeContextAI(input);
      if (result && result.project && result.task) {
        return {
          project: String(result.project),
          task: String(result.task),
          confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.7)),
          category: result.category || 'general',
          distraction: Boolean(result.distraction),
          distractionReason: result.distractionReason || undefined,
          summary: String(result.summary || ''),
          nextAction: String(result.nextAction || ''),
          analyzedAt: new Date().toISOString(),
        };
      }
      // Fallback to local heuristic if backend AI returned nothing/failed
      return this.fallback.analyzeContext(input);
    } catch (error) {
      console.warn('[ContextSwitch] Cloud AI proxy failed, using offline heuristics:', error);
      return this.fallback.analyzeContext(input);
    }
  }

  async generateSummary(input: AISummaryInput): Promise<string> {
    try {
      const summary = await apiClient.generateSummaryAI(input);
      if (summary && summary.length > 10) {
        return summary;
      }
      return this.fallback.generateSummary(input);
    } catch (error) {
      console.warn('[ContextSwitch] Cloud AI summary failed, using offline heuristics:', error);
      return this.fallback.generateSummary(input);
    }
  }
}
