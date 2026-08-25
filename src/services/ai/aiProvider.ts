/**
 * ContextSwitch — AI Provider Interface
 * Layer 3: Provider-agnostic abstraction for context analysis.
 *
 * Any LLM provider (Gemini, OpenAI, Anthropic, local models) implements this interface.
 */

import { AIContextResult, AIAnalysisInput, AISummaryInput } from '../../types/context';

export interface AIProvider {
  /** Human-readable provider name (e.g. "Gemini 2.0 Flash", "Local Fallback") */
  readonly name: string;

  /** Whether this provider requires an API key */
  readonly requiresApiKey: boolean;

  /**
   * Analyze browser context and return structured project/task/distraction detection.
   */
  analyzeContext(input: AIAnalysisInput): Promise<AIContextResult>;

  /**
   * Generate a human-readable session summary.
   */
  generateSummary(input: AISummaryInput): Promise<string>;
}
