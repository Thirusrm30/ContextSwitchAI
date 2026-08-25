# ContextSwitch — Layer 2: Browser Context Engine

## Goal

Replace all mock/static browser data with **real Chrome tab and window activity** tracked in real time. Build a Context Engine that maintains live state, auto-categorizes domains, groups tabs into projects, tracks time-on-tab, detects context switches, and persists everything locally.

---

## Permissions

The existing `manifest.json` already declares `tabs`, `activeTab`, `storage`, `alarms`, and `sidePanel`. **No new permissions are needed** — Layer 2 uses only what Layer 1 already requested.

| Permission | Used For |
|---|---|
| `tabs` | `chrome.tabs.query`, `onUpdated`, `onActivated`, `onRemoved`, `onCreated` |
| `activeTab` | Reading URL/title of the current active tab |
| `storage` | Persisting context engine state locally via `chrome.storage.local` |
| `alarms` | Periodic time-tracking heartbeat (1-minute interval) |
| `sidePanel` | Rendering the React dashboard |

---

## Proposed Changes

### Types & Data Contracts

#### [MODIFY] [context.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/types/context.ts)

Extend existing interfaces and add new ones:

- Add `timeSpentSeconds` and `lastActivatedAt` fields to `TabItem`
- Add new `DomainCategory` type union for auto-categorization (`'development' | 'productivity' | 'communication' | 'entertainment' | 'research' | 'social' | 'general'`)
- Add `domainCategory` field to `TabItem`
- Add new `ContextSwitchEvent` interface — `{ id, fromTab, toTab, timestamp, fromDomain, toDomain }`
- Add new `TabGroup` interface — `{ groupName, tabs, primaryCategory, confidence }`
- Add `contextSwitchEvents`, `tabGroups`, `sessionStartTime`, `lastActivityTime` fields to `ContextState`
- Keep `recentSessions` and `WorkSession` as-is for backward compat

---

### Context Engine (core new service)

#### [NEW] [contextEngine.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/contextEngine.ts)

The brain of Layer 2. A pure-logic module (no Chrome API calls directly — receives data from the service worker via messages):

- **`categorizeDomain(domain: string): DomainCategory`** — Rule-based categorizer:
  - `github.com`, `gitlab.com`, `bitbucket.org`, `stackoverflow.com`, `firebase.google.com`, `npmjs.com`, `react.dev`, `developer.mozilla.org` → `development`
  - `docs.google.com`, `notion.so`, `trello.com`, `figma.com`, `jira.atlassian.net` → `productivity`
  - `gmail.com`, `outlook.com`, `slack.com`, `discord.com`, `teams.microsoft.com` → `communication`
  - `youtube.com`, `netflix.com`, `twitch.tv`, `reddit.com` → `entertainment`
  - `scholar.google.com`, `arxiv.org`, `wikipedia.org`, `medium.com` → `research`
  - `twitter.com`, `facebook.com`, `instagram.com`, `linkedin.com` → `social`
  - Everything else → `general`
- **`groupTabsByProject(tabs: TabItem[]): TabGroup[]`** — Groups tabs sharing related domains/categories into suggested project clusters using domain co-occurrence heuristics
- **`computeContextScore(tabs, switchEvents, activeMinutes): number`** — Calculates focus score (0–100) based on category coherence, switch frequency, and session duration
- **`detectFocusState(score): FocusState`** — Maps score ranges to `'Deep Work' | 'Moderate Focus' | 'Fragmented Context' | 'High Switching'`

---

### Background Service Worker (real tracking)

#### [MODIFY] [service-worker.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/extension/background/service-worker.ts)

Major rewrite — this becomes the real-time tracking hub:

- **Tab event listeners**:
  - `chrome.tabs.onCreated` → record new tab in state
  - `chrome.tabs.onRemoved` → remove tab from state
  - `chrome.tabs.onActivated` → update active tab, record context switch event, start time tracking
  - `chrome.tabs.onUpdated` → update tab title/URL/domain when page loads
  - `chrome.windows.onFocusChanged` → handle window focus changes
- **Time tracking via `chrome.alarms`**:
  - Create a `cs_heartbeat` alarm every 60 seconds
  - On each tick, increment `timeSpentSeconds` for the currently active tab
  - Track `deepWorkMinutes` when category stays consistent
- **State persistence**:
  - Debounced save to `chrome.storage.local` after each state mutation (max once per 2 seconds)
  - Full state snapshot saved on `chrome.alarms` heartbeat
- **Message API for Side Panel**:
  - `CS_GET_LIVE_STATE` → returns full current context state (tabs, groups, switches, score)
  - `CS_CLEAR_CONTEXT_DATA` → wipes all tracked data from storage
  - `CS_GET_STATUS` → existing, returns extension health (keep backward compat)

---

### Storage Service

#### [MODIFY] [storageService.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/storageService.ts)

- Add `clearAllData()` method to wipe all `cs_*` keys from `chrome.storage.local`
- Add `loadLiveContext()` that messages the service worker via `chrome.runtime.sendMessage({ type: 'CS_GET_LIVE_STATE' })`
- Preserve `loadState()` / `saveState()` for session persistence (backward compat)
- Add fallback: if `chrome.runtime.sendMessage` fails (dev mode / no extension), return mock data from `mockData.ts`

---

### UI Components

#### [MODIFY] [CurrentContextCard.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/CurrentContextCard.tsx)

- Show real **active tab title** and **detected category badge** instead of static project/task
- Display **time spent on current tab** (live updating)
- Show **domain** of the active tab

#### [NEW] [ContextSwitchTimeline.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/ContextSwitchTimeline.tsx)

- Visual timeline of recent context switch events (last 10)
- Shows `from → to` domain transitions with timestamps
- Color-coded by category

#### [NEW] [TabGroupsView.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/TabGroupsView.tsx)

- Display auto-detected project groups with group name, tab count, primary category
- Each group is expandable to show member tabs

#### [MODIFY] [PrivacyStatusBadge.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/components/PrivacyStatusBadge.tsx)

- Add a **"Clear Context Data"** button that calls `storageService.clearAllData()` and resets state
- Show data storage size estimate

#### [MODIFY] [SidePanelDashboard.tsx](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/pages/SidePanelDashboard.tsx)

- Replace `INITIAL_CONTEXT_STATE` with live data from the service worker
- Add polling interval (every 3 seconds) to refresh live context from background
- Integrate new `ContextSwitchTimeline` and `TabGroupsView` components
- Wire up `Clear Context Data` flow
- Graceful fallback to mock data when not running as extension

---

### Mock Data (preserved as fallback)

#### [MODIFY] [mockData.ts](file:///c:/Users/THIRU%20SELVAN/OneDrive/Desktop/buildthon%20prj/src/services/mockData.ts)

- Update `INITIAL_CONTEXT_STATE` to include the new fields (`contextSwitchEvents: []`, `tabGroups: []`, `sessionStartTime`, `lastActivityTime`)
- Keep all existing mock session data

---

## Architecture Summary

```
┌─────────────────────────────────────┐
│           Side Panel (React)         │
│  SidePanelDashboard ← polls every 3s│
│  ┌───────────┐ ┌───────────────────┐ │
│  │ContextCard│ │ContextSwitchTimeline│
│  │ TabGroups │ │ OpenTabs  │ Score │ │
│  └───────────┘ └───────────────────┘ │
│          ↕ chrome.runtime.sendMessage│
├─────────────────────────────────────┤
│     Background Service Worker        │
│  ┌─────────────────────────────────┐ │
│  │  Tab Event Listeners            │ │
│  │  chrome.tabs.onActivated        │ │
│  │  chrome.tabs.onUpdated          │ │
│  │  chrome.tabs.onCreated          │ │
│  │  chrome.tabs.onRemoved          │ │
│  │  chrome.windows.onFocusChanged  │ │
│  └──────────┬──────────────────────┘ │
│             ↓                        │
│  ┌─────────────────────────────────┐ │
│  │  Context Engine (Pure Logic)    │ │
│  │  categorizeDomain()            │ │
│  │  groupTabsByProject()          │ │
│  │  computeContextScore()         │ │
│  │  detectFocusState()            │ │
│  └──────────┬──────────────────────┘ │
│             ↓                        │
│  ┌─────────────────────────────────┐ │
│  │  chrome.storage.local           │ │
│  │  (debounced persist every 2s)   │ │
│  └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│     Content Script (unchanged)       │
└─────────────────────────────────────┘
```

---

## Verification Plan

### Build Verification
- `npm run build` completes with zero errors
- `dist/` contains updated `service-worker.js` with tab tracking code

### Manual Extension Testing
1. Load `dist/` as unpacked extension in Chrome
2. Open several tabs (GitHub, Firebase docs, Stack Overflow, YouTube, Gmail)
3. Open Side Panel → verify it shows **real open tabs** with correct titles, domains, and categories
4. Switch between tabs → verify **Context Switch Timeline** records transitions
5. Wait 1–2 minutes → verify **Time Spent** increments on active tab
6. Verify **Tab Groups** auto-clusters related tabs
7. Click **Clear Context Data** → verify state resets
8. Close/reopen Side Panel → verify state persists from `chrome.storage.local`
