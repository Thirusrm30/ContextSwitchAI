/**
 * ContextSwitch — Backend Gemini AI Service
 * Calls Google Gemini REST API using server-side environment variable (AI_API_KEY).
 * Protects credentials from client-side exposure.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:generateContent';

const CONTEXT_ANALYSIS_PROMPT = `You are ContextSwitch AI, a real-time browser productivity assistant. Analyze the user's open browser tabs and recent context switches to infer their current working context.

You MUST respond with a valid raw JSON object and nothing else. Do not include markdown formatting, code fences, or any prefix/suffix text.

JSON schema:
{
  "project": "string — inferred project or activity name from actual tab patterns",
  "task": "string — specific task currently being performed",
  "confidence": number (0.0 to 1.0),
  "category": "development" | "productivity" | "communication" | "entertainment" | "research" | "social" | "general",
  "distraction": boolean,
  "distractionReason": "string or null",
  "summary": "string — concise 1-2 sentence overview of observed activity",
  "nextAction": "string — 1 actionable next step"
}

Rules:
- Infer from genuine tab titles and domains (e.g. GitHub repositories, documentation docs, localhost pages).
- If tabs are general/empty, reflect that realistically.
- Set distraction=true only when current tab contradicts dominant productive workflow.`;

const SESSION_SUMMARY_PROMPT = `You are ContextSwitch AI. Generate a concise, professional session summary based on the provided browser activity and tabs.

Cover:
1. What was worked on
2. Key domains and tools accessed
3. Potential unfinished steps
4. Next recommended action

Keep the output concise, accurate, and 2-4 sentences max.`;

async function callGemini(apiKey, systemPrompt, userContent) {
  const url = `${GEMINI_API_URL}?key=${apiKey}`;
  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userContent }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 512
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

function parseJson(raw) {
  try {
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function analyzeContext(input) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured on the server');
  }

  const lines = [
    `Session Duration: ${input.sessionDurationMinutes || 0} minutes`,
    `Dominant Category: ${input.dominantCategory || 'general'}`,
    '',
    'Open Tabs (Domain — Title):'
  ];

  for (const tab of input.tabs || []) {
    const activeMarker = tab.isActive ? ' [ACTIVE]' : '';
    lines.push(`  • ${tab.domain} — "${tab.title}"${activeMarker}`);
  }

  if (input.recentSwitches && input.recentSwitches.length > 0) {
    lines.push('', 'Recent Context Switches:');
    for (const sw of input.recentSwitches.slice(-5)) {
      lines.push(`  • ${sw.fromDomain} (${sw.fromCategory}) -> ${sw.toDomain} (${sw.toCategory})`);
    }
  }

  const userPrompt = lines.join('\n');
  const responseText = await callGemini(apiKey, CONTEXT_ANALYSIS_PROMPT, userPrompt);
  const parsed = parseJson(responseText);

  if (!parsed || !parsed.project) {
    throw new Error('Invalid JSON structure returned by Gemini');
  }

  return {
    project: String(parsed.project),
    task: String(parsed.task || 'General Browsing'),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
    category: parsed.category || 'general',
    distraction: Boolean(parsed.distraction),
    distractionReason: parsed.distractionReason || null,
    summary: String(parsed.summary || ''),
    nextAction: String(parsed.nextAction || ''),
    analyzedAt: new Date().toISOString()
  };
}

async function generateSummary(input) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not configured on the server');
  }

  const lines = [
    `Session Duration: ${input.sessionDurationMinutes || 0} minutes`,
    `Context Switches: ${input.switchCount || 0}`,
    `Primary Category: ${input.dominantCategory || 'general'}`,
    '',
    'Tabs Visited:'
  ];

  for (const tab of input.tabs || []) {
    lines.push(`  • ${tab.domain} — "${tab.title}"`);
  }

  const userPrompt = lines.join('\n');
  const summary = await callGemini(apiKey, SESSION_SUMMARY_PROMPT, userPrompt);
  return summary || 'Session completed successfully.';
}

module.exports = {
  analyzeContext,
  generateSummary
};
