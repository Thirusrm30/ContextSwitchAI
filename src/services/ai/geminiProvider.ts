/**
 * ContextSwitch — Gemini AI Provider
 * Layer 3: Cloud AI analysis via Google Gemini API.
 *
 * Sends sanitized browser context (domain + title only) to Gemini
 * and receives structured JSON analysis.
 *
 * Falls back to LocalFallbackProvider on any error.
 */

import { AIProvider } from './aiProvider';
import { LocalFallbackProvider } from './localFallbackProvider';
import { AIContextResult, AIAnalysisInput, AISummaryInput } from '../../types/context';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CONTEXT_ANALYSIS_PROMPT = `You are ContextSwitch AI, a browser productivity assistant. Analyze the user's open browser tabs and recent context switches to determine their current work context.

You MUST respond with a valid JSON object and nothing else. Do not include markdown formatting, code fences, or explanatory text.

JSON schema:
{
  "project": "string — likely project name based on tab patterns",
  "task": "string — specific task the user is currently working on",
  "confidence": "number 0.0-1.0 — how confident you are in this analysis",
  "category": "string — one of: development, productivity, communication, entertainment, research, social, general",
  "distraction": "boolean — true if the active tab seems unrelated to the dominant work pattern",
  "distractionReason": "string|null — brief explanation if distraction is true",
  "summary": "string — one-sentence summary of what the user is working on",
  "nextAction": "string — one suggested next step for the user"
}

Rules:
- Infer the project name from GitHub repos, documentation topics, or recurring themes in tab titles
- The task should be specific (e.g., "Implementing Firebase authentication" not just "coding")
- Set distraction=true only when the active tab's category clearly differs from the dominant work pattern
- Keep summary and nextAction concise (under 100 chars each)`;

const SESSION_SUMMARY_PROMPT = `You are ContextSwitch AI. Generate a brief productivity session summary based on the user's browser tabs.

Respond with a plain text summary (2-4 sentences) covering:
1. What the user worked on
2. Key resources used
3. Possible unfinished work
4. Suggested next step

Be concise and professional.`;

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini 2.0 Flash (Cloud)';
  readonly requiresApiKey = true;

  private apiKey: string;
  private fallback: LocalFallbackProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new LocalFallbackProvider();
  }

  async analyzeContext(input: AIAnalysisInput): Promise<AIContextResult> {
    try {
      const userContent = this.buildAnalysisPrompt(input);
      const response = await this.callGemini(CONTEXT_ANALYSIS_PROMPT, userContent);
      const parsed = this.parseJsonResponse(response);

      if (parsed && parsed.project && parsed.task) {
        return {
          project: String(parsed.project),
          task: String(parsed.task),
          confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
          category: this.validateCategory(parsed.category),
          distraction: Boolean(parsed.distraction),
          distractionReason: parsed.distractionReason ? String(parsed.distractionReason) : undefined,
          summary: String(parsed.summary || ''),
          nextAction: String(parsed.nextAction || ''),
          analyzedAt: new Date().toISOString(),
        };
      }

      // If response didn't parse correctly, fall back
      console.warn('[ContextSwitch] Gemini response parse failed, using fallback');
      return this.fallback.analyzeContext(input);
    } catch (error) {
      console.warn('[ContextSwitch] Gemini API error, falling back to local:', error);
      return this.fallback.analyzeContext(input);
    }
  }

  async generateSummary(input: AISummaryInput): Promise<string> {
    try {
      const userContent = this.buildSummaryPrompt(input);
      const response = await this.callGemini(SESSION_SUMMARY_PROMPT, userContent);
      if (response && response.length > 10) {
        return response;
      }
      return this.fallback.generateSummary(input);
    } catch (error) {
      console.warn('[ContextSwitch] Gemini summary error, falling back to local:', error);
      return this.fallback.generateSummary(input);
    }
  }

  // ─── Gemini API Call ───

  private async callGemini(systemPrompt: string, userContent: string): Promise<string> {
    const url = `${GEMINI_API_URL}?key=${this.apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 512,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim();
  }

  // ─── Prompt Builders ───

  private buildAnalysisPrompt(input: AIAnalysisInput): string {
    const lines: string[] = [];

    lines.push(`Session duration: ${input.sessionDurationMinutes} minutes`);
    lines.push(`Dominant activity category: ${input.dominantCategory}`);
    lines.push('');
    lines.push('Open tabs (domain — title):');

    for (const tab of input.tabs) {
      const marker = tab.isActive ? ' [ACTIVE]' : '';
      const time = tab.timeSpentSeconds > 0 ? ` (${Math.floor(tab.timeSpentSeconds / 60)}m)` : '';
      lines.push(`  • ${tab.domain} — "${tab.title}"${marker}${time}`);
    }

    if (input.recentSwitches.length > 0) {
      lines.push('');
      lines.push('Recent context switches:');
      for (const sw of input.recentSwitches.slice(-5)) {
        lines.push(`  • ${sw.fromDomain} (${sw.fromCategory}) → ${sw.toDomain} (${sw.toCategory})`);
      }
    }

    return lines.join('\n');
  }

  private buildSummaryPrompt(input: AISummaryInput): string {
    const lines: string[] = [];

    lines.push(`Session: ${input.sessionDurationMinutes} minutes, ${input.switchCount} context switches`);
    lines.push(`Primary focus: ${input.dominantCategory}`);
    lines.push('');
    lines.push('Tabs used:');

    for (const tab of input.tabs) {
      const time = tab.timeSpentSeconds > 0 ? ` (${Math.floor(tab.timeSpentSeconds / 60)}m)` : '';
      lines.push(`  • ${tab.domain} — "${tab.title}"${time}`);
    }

    return lines.join('\n');
  }

  // ─── Helpers ───

  private parseJsonResponse(text: string): Record<string, unknown> | null {
    try {
      // Strip markdown code fences if present
      let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      // Try to find JSON object in the response
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  private validateCategory(cat: unknown): AIContextResult['category'] {
    const valid = ['development', 'productivity', 'communication', 'entertainment', 'research', 'social', 'general'];
    if (typeof cat === 'string' && valid.includes(cat)) {
      return cat as AIContextResult['category'];
    }
    return 'general';
  }
}
