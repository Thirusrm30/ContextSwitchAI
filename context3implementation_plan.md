# ContextSwitch — Layer 3: AI Context Intelligence

## Goal

Add an AI Context Engine that transforms raw browser activity into meaningful work context — detecting projects, tasks, distractions, generating session summaries, and suggesting next actions. Uses a provider-agnostic `AIService` abstraction with privacy-first data sanitization.

---

## Architecture

```
┌────────────────────────────────────────┐
│         Side Panel (React)              │
│  ┌──────────┐ ┌──────────────────────┐ │
│  │AIContext  │ │DistractionAlert     │ │
│  │Card      │ │ (modal overlay)     │ │
│  │          │ │                     │ │
│  └──────────┘ └──────────────────────┘ │
│         ↕ aiService.analyzeContext()    │
├────────────────────────────────────────┤
│              AIService                  │
│  ┌─────────────────────────────────┐   │
│  │ privacySanitizer.ts             │   │
│  │ Strip URLs, remove query params │   │
│  │ Domain-only + title, exclude    │   │
│  └──────────┬──────────────────────┘   │
│             ↓                          │
│  ┌─────────────────────────────────┐   │
│  │ aiProvider (swappable)          │   │
│  │ ┌───────────┐ ┌──────────────┐  │   │
│  │ │ Local     │ │ Gemini API   │  │   │
│  │ │ Fallback  │ │ (Cloud AI)   │  │   │
│  │ │ (rules)   │ │              │  │   │
│  │ └───────────┘ └──────────────┘  │   │
│  └─────────────────────────────────┘   │
├────────────────────────────────────────┤
│  Service Worker (unchanged from L2)     │
│  chrome.storage.local (settings)        │
└────────────────────────────────────────┘
```

### Key Design Decisions

1. **AI runs in the Side Panel** (not the service worker) — service workers have short lifetimes in MV3 and can't hold long HTTP connections reliably. The side panel React app calls the AI service directly.
2. **Provider abstraction** — `AIProvider` interface with `analyzeContext()` and `generateSummary()`. Two implementations: `LocalFallbackProvider` (rule-based, no network) and `GeminiProvider` (cloud API).
3. **Privacy sanitization happens before any data reaches the provider** — a dedicated `privacySanitizer.ts` module strips query params, removes sensitive URLs, and only passes domain + page title.

---

## Proposed Changes

### Types

#### [MODIFY] [context.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/types/context.ts)

Add new interfaces:

```typescript
// AI analysis result returned by any provider
interface AIContextResult {
  project: string;
  task: string;
  confidence: number;
  category: DomainCategory;
  distraction: boolean;
  distractionReason?: string;
  summary: string;
  nextAction: string;
  analyzedAt: string;
}

// AI processing mode setting
type AIProcessingMode = 'local_only' | 'cloud_ai';

// AI settings stored in chrome.storage
interface AISettings {
  processingMode: AIProcessingMode;
  apiKey?: string;
  excludedDomains: string[];
  autoAnalyze: boolean;
}
```

Add `aiContext?: AIContextResult` and `aiSettings?: AISettings` to `ContextState`.

---

### Privacy Sanitization

#### [NEW] [privacySanitizer.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/privacySanitizer.ts)

- `sanitizeTabsForAI(tabs, excludedDomains)` → returns array of `{ domain, title }` objects
- Strips full URLs, removes query parameters
- Filters out excluded domains (configurable)
- Removes `chrome://`, `chrome-extension://`, `about:` URLs
- Never includes form values or passwords

---

### AI Provider Abstraction

#### [NEW] [aiProvider.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/ai/aiProvider.ts)

Interface:
```typescript
interface AIProvider {
  name: string;
  analyzeContext(input: AIAnalysisInput): Promise<AIContextResult>;
  generateSummary(input: AISummaryInput): Promise<string>;
}
```

#### [NEW] [localFallbackProvider.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/ai/localFallbackProvider.ts)

Pure rule-based provider (no network, no API key needed):
- Detects project name from tab title patterns (e.g. GitHub repo names, doc titles)
- Identifies task from the active tab's title
- Detects distraction when active tab category is `entertainment`/`social` while dominant category is `development`/`productivity`
- Generates summary from domain frequency and session duration
- Always available as fallback

#### [NEW] [geminiProvider.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/ai/geminiProvider.ts)

Cloud AI provider using Gemini API:
- Sends sanitized `{ domain, title }` pairs to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- API key from settings (stored in chrome.storage, never hardcoded)
- Structured JSON output via system prompt
- Graceful fallback to local provider on network error

#### [NEW] [aiService.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/ai/aiService.ts)

Orchestrator:
- Loads AI settings from storage
- Selects provider based on `processingMode`
- Calls `privacySanitizer` before passing data to any provider
- Exposes `analyzeCurrentContext(tabs, switchEvents)` and `generateSessionSummary(tabs, duration)` to the UI
- Caches results to avoid redundant API calls (re-analyzes only when tabs change significantly)

---

### UI Components

#### [NEW] [AIContextCard.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/AIContextCard.tsx)

Displays the AI analysis result:
- 🧠 "AI Detected Context" header
- Project name, Task, Confidence gauge, Category badge
- Summary text
- Suggested next action
- "Analyzing..." shimmer state while AI is processing
- Error state if AI fails (shows "Using local analysis" fallback badge)

#### [NEW] [DistractionAlert.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/DistractionAlert.tsx)

Non-blocking overlay when distraction is detected:
- "Possible context switch detected"
- Shows current task vs. distraction domain
- Two actions: `[Continue Working]` and `[Take a Break]`
- "Continue Working" dismisses the alert
- "Take a Break" dismisses and starts a break timer display
- Does NOT block the website

#### [NEW] [AISettingsPanel.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/AISettingsPanel.tsx)

Settings section within the dashboard:
- Toggle: `Local Only` / `Cloud AI`
- API key input (masked, stored in chrome.storage)
- Excluded domains list (comma-separated)
- Auto-analyze toggle

#### [MODIFY] [SidePanelDashboard.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/pages/SidePanelDashboard.tsx)

- Import and render `AIContextCard` (after the Context Score Gauge)
- Import and render `DistractionAlert` (as an overlay)
- Import and render `AISettingsPanel` (before the Privacy Status badge)
- Call `aiService.analyzeCurrentContext()` on each poll cycle (debounced — only re-analyzes when tabs actually changed)
- Pass AI results and distraction state to components

---

### Storage

#### [MODIFY] [storageService.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/storageService.ts)

- Add `loadAISettings()` and `saveAISettings()` methods
- Default settings: `{ processingMode: 'local_only', excludedDomains: [], autoAnalyze: true }`

---

## Open Questions

> [!IMPORTANT]
> **Which LLM API should I configure?** The plan defaults to **Google Gemini API** (`gemini-2.0-flash`). The architecture supports swapping to OpenAI, Anthropic, or any other provider later. Is Gemini acceptable for now?

---

## Verification Plan

### Build
- `npm run build` with 0 errors

### Manual Testing
1. Load extension → open Side Panel → verify **AI Context Card** appears with "Local Only" analysis
2. Open GitHub + Firebase + StackOverflow tabs → AI should detect "Development" project
3. Open YouTube while working → **Distraction Alert** should appear
4. Click "Continue Working" → alert dismisses
5. Go to AI Settings → switch to "Cloud AI" → enter API key → verify Gemini analysis runs
6. Verify sanitized data (no full URLs, no query params) in network tab
7. Click "Clear Context Data" → AI state also resets
