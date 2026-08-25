/**
 * ContextSwitch - Background Service Worker (Manifest V3)
 * Layer 2: Real-time tab tracking, context switch detection, time tracking.
 *
 * This runs as the extension's background service worker. It listens to
 * Chrome tab/window events, maintains a live context state in memory,
 * and persists it to chrome.storage.local.
 */

// ─── Inline Context Engine (service worker can't import from src/) ───

type DomainCategory =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'entertainment'
  | 'research'
  | 'social'
  | 'general';

interface TabItem {
  id: string | number;
  title: string;
  url: string;
  domain: string;
  category?: 'docs' | 'repo' | 'qa' | 'tool' | 'communication' | 'general';
  domainCategory?: DomainCategory;
  isActive?: boolean;
  favicon?: string;
  timeSpentSeconds?: number;
  lastActivatedAt?: string;
}

interface ContextSwitchEvent {
  id: string;
  fromTabTitle: string;
  toTabTitle: string;
  fromDomain: string;
  toDomain: string;
  fromCategory: DomainCategory;
  toCategory: DomainCategory;
  timestamp: string;
}

interface TabGroup {
  groupName: string;
  tabs: TabItem[];
  primaryCategory: DomainCategory;
  confidence: number;
}

interface LiveContextState {
  openTabs: TabItem[];
  activeTabId: number | null;
  contextSwitchEvents: ContextSwitchEvent[];
  tabGroups: TabGroup[];
  contextScore: number;
  focusState: string;
  switchesToday: number;
  deepWorkMinutes: number;
  sessionStartTime: string;
  lastActivityTime: string;
  activeProject: string;
  currentTask: string;
}

// ─── Domain Categorization Rules ───

const DOMAIN_RULES: Record<string, DomainCategory> = {
  'github.com': 'development',
  'gitlab.com': 'development',
  'bitbucket.org': 'development',
  'stackoverflow.com': 'development',
  'firebase.google.com': 'development',
  'npmjs.com': 'development',
  'react.dev': 'development',
  'developer.mozilla.org': 'development',
  'developer.chrome.com': 'development',
  'angular.io': 'development',
  'vuejs.org': 'development',
  'svelte.dev': 'development',
  'nextjs.org': 'development',
  'vercel.com': 'development',
  'netlify.com': 'development',
  'codepen.io': 'development',
  'codesandbox.io': 'development',
  'replit.com': 'development',
  'aws.amazon.com': 'development',
  'cloud.google.com': 'development',
  'portal.azure.com': 'development',
  'docker.com': 'development',
  'pypi.org': 'development',
  'prisma.io': 'development',
  'socket.io': 'development',
  'rxjs.dev': 'development',
  'tailwindcss.com': 'development',
  'stripe.com': 'development',
  'dev.to': 'development',
  'docs.google.com': 'productivity',
  'sheets.google.com': 'productivity',
  'slides.google.com': 'productivity',
  'notion.so': 'productivity',
  'trello.com': 'productivity',
  'figma.com': 'productivity',
  'jira.atlassian.net': 'productivity',
  'asana.com': 'productivity',
  'clickup.com': 'productivity',
  'monday.com': 'productivity',
  'miro.com': 'productivity',
  'airtable.com': 'productivity',
  'calendar.google.com': 'productivity',
  'drive.google.com': 'productivity',
  'canva.com': 'productivity',
  'gmail.com': 'communication',
  'mail.google.com': 'communication',
  'outlook.com': 'communication',
  'outlook.live.com': 'communication',
  'slack.com': 'communication',
  'discord.com': 'communication',
  'teams.microsoft.com': 'communication',
  'zoom.us': 'communication',
  'meet.google.com': 'communication',
  'web.whatsapp.com': 'communication',
  'web.telegram.org': 'communication',
  'youtube.com': 'entertainment',
  'netflix.com': 'entertainment',
  'twitch.tv': 'entertainment',
  'spotify.com': 'entertainment',
  'open.spotify.com': 'entertainment',
  'music.youtube.com': 'entertainment',
  'scholar.google.com': 'research',
  'arxiv.org': 'research',
  'wikipedia.org': 'research',
  'medium.com': 'research',
  'twitter.com': 'social',
  'x.com': 'social',
  'facebook.com': 'social',
  'instagram.com': 'social',
  'linkedin.com': 'social',
  'reddit.com': 'social',
};

function categorizeDomain(domain: string): DomainCategory {
  if (!domain) return 'general';
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_RULES[normalized]) return DOMAIN_RULES[normalized];
  const parts = normalized.split('.');
  if (parts.length > 2) {
    const parent = parts.slice(-2).join('.');
    if (DOMAIN_RULES[parent]) return DOMAIN_RULES[parent];
  }
  if (/github\.io$/i.test(normalized) || /\.dev$/i.test(normalized) ||
      /developer\./i.test(normalized) || /docs\./i.test(normalized)) {
    return 'development';
  }
  return 'general';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function groupTabsByProject(tabs: TabItem[]): TabGroup[] {
  if (tabs.length === 0) return [];
  const buckets: Record<string, TabItem[]> = {};
  for (const tab of tabs) {
    const cat = tab.domainCategory || categorizeDomain(tab.domain);
    const key = cat;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(tab);
  }
  const groups: TabGroup[] = [];
  const labelMap: Record<string, string> = {
    development: 'Development',
    productivity: 'Productivity',
    communication: 'Communication',
    entertainment: 'Entertainment',
    research: 'Research',
    social: 'Social',
    general: 'Other Browsing',
  };
  for (const [cat, catTabs] of Object.entries(buckets)) {
    groups.push({
      groupName: labelMap[cat] || 'Other Browsing',
      tabs: catTabs,
      primaryCategory: cat as DomainCategory,
      confidence: Math.min(95, 55 + catTabs.length * 8),
    });
  }
  return groups;
}

function computeContextScore(
  tabs: TabItem[],
  switchEvents: ContextSwitchEvent[],
  activeMinutes: number
): number {
  if (tabs.length === 0) return 0;
  const categories = tabs.map(t => t.domainCategory || categorizeDomain(t.domain));
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) || 0) + 1);
  const dominantCount = Math.max(...counts.values());
  const coherence = Math.round((dominantCount / tabs.length) * 40);
  const recentSwitches = switchEvents.filter(e => {
    return Date.now() - new Date(e.timestamp).getTime() < 30 * 60 * 1000;
  }).length;
  const switchScore = Math.max(0, 30 - recentSwitches * 3);
  const durationScore = Math.min(30, Math.round(activeMinutes * 0.6));
  return Math.max(0, Math.min(100, coherence + switchScore + durationScore));
}

function detectFocusState(score: number): string {
  if (score >= 80) return 'Deep Work';
  if (score >= 60) return 'Moderate Focus';
  if (score >= 35) return 'Fragmented Context';
  return 'High Switching';
}

// ─── Live State ───

let liveState: LiveContextState = {
  openTabs: [],
  activeTabId: null,
  contextSwitchEvents: [],
  tabGroups: [],
  contextScore: 0,
  focusState: 'Moderate Focus',
  switchesToday: 0,
  deepWorkMinutes: 0,
  sessionStartTime: new Date().toISOString(),
  lastActivityTime: new Date().toISOString(),
  activeProject: 'Detecting...',
  currentTask: 'Analyzing browser activity...',
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Persistence ───

const STORAGE_KEY = 'cs_live_context_v2';

async function loadPersistedState(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) {
      const persisted = result[STORAGE_KEY] as LiveContextState;
      // Merge persisted state but re-detect tabs fresh
      liveState.contextSwitchEvents = persisted.contextSwitchEvents || [];
      liveState.switchesToday = persisted.switchesToday || 0;
      liveState.deepWorkMinutes = persisted.deepWorkMinutes || 0;
      liveState.sessionStartTime = persisted.sessionStartTime || new Date().toISOString();
    }
  } catch (e) {
    console.warn('[ContextSwitch] Failed to load persisted state:', e);
  }
}

function debouncedSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({ [STORAGE_KEY]: liveState }).catch((e: Error) => {
      console.warn('[ContextSwitch] Save error:', e);
    });
  }, 2000);
}

function forceSave(): void {
  chrome.storage.local.set({ [STORAGE_KEY]: liveState }).catch((e: Error) => {
    console.warn('[ContextSwitch] Force save error:', e);
  });
}

// ─── Tab Helpers ───

function chromeTabToTabItem(tab: chrome.tabs.Tab, isActive: boolean): TabItem {
  const domain = extractDomain(tab.url || '');
  const dc = categorizeDomain(domain);
  return {
    id: tab.id || 0,
    title: tab.title || 'Untitled',
    url: tab.url || '',
    domain,
    domainCategory: dc,
    isActive,
    favicon: tab.favIconUrl || '',
    timeSpentSeconds: 0,
    lastActivatedAt: isActive ? new Date().toISOString() : undefined,
  };
}

async function refreshAllTabs(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const activeTabsArr = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = activeTabsArr[0]?.id || null;

    // Preserve time spent from existing tracked tabs
    const existingTimeMap = new Map<number, number>();
    for (const t of liveState.openTabs) {
      if (typeof t.id === 'number' && t.timeSpentSeconds) {
        existingTimeMap.set(t.id, t.timeSpentSeconds);
      }
    }

    liveState.openTabs = tabs
      .filter(t => t.id !== undefined && t.url && !t.url.startsWith('chrome://'))
      .map(t => {
        const item = chromeTabToTabItem(t, t.id === activeTabId);
        // Restore tracked time
        if (typeof t.id === 'number' && existingTimeMap.has(t.id)) {
          item.timeSpentSeconds = existingTimeMap.get(t.id)!;
        }
        return item;
      });

    liveState.activeTabId = activeTabId;
    recalculate();
    debouncedSave();
  } catch (e) {
    console.warn('[ContextSwitch] Error refreshing tabs:', e);
  }
}

function recalculate(): void {
  const elapsed = (Date.now() - new Date(liveState.sessionStartTime).getTime()) / 60000;
  liveState.tabGroups = groupTabsByProject(liveState.openTabs);
  liveState.contextScore = computeContextScore(
    liveState.openTabs,
    liveState.contextSwitchEvents,
    elapsed
  );
  liveState.focusState = detectFocusState(liveState.contextScore);
  liveState.lastActivityTime = new Date().toISOString();

  // Derive active project from the dominant tab group
  if (liveState.tabGroups.length > 0) {
    const sorted = [...liveState.tabGroups].sort((a, b) => b.tabs.length - a.tabs.length);
    liveState.activeProject = sorted[0].groupName;
  }

  // Derive current task from active tab
  const activeTab = liveState.openTabs.find(t => t.isActive);
  if (activeTab) {
    liveState.currentTask = activeTab.title;
  }
}

// ─── Side Panel Behavior ───

if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => {
      console.warn('[ContextSwitch] Failed to set side panel behavior:', error);
    });
}

// ─── Extension Install Lifecycle ───

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ContextSwitch] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    chrome.storage.local.set({
      cs_version: '2.0.0',
      cs_initialized_at: new Date().toISOString(),
      cs_privacy_mode: 'local_only',
      cs_auto_detect_switch: true,
    });
  }

  // Create heartbeat alarm for time tracking (fires every 1 minute)
  chrome.alarms.create('cs_heartbeat', { periodInMinutes: 1 });

  // Initial tab scan
  refreshAllTabs();
});

// ─── Also load on service worker startup (not just install) ───

loadPersistedState().then(() => {
  refreshAllTabs();
});

chrome.alarms.create('cs_heartbeat', { periodInMinutes: 1 });

// ─── Tab Event Listeners ───

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined && tab.url && !tab.url.startsWith('chrome://')) {
    const item = chromeTabToTabItem(tab, false);
    liveState.openTabs.push(item);
    recalculate();
    debouncedSave();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  liveState.openTabs = liveState.openTabs.filter(t => t.id !== tabId);
  recalculate();
  debouncedSave();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const previousActiveTab = liveState.openTabs.find(t => t.isActive);

  // Mark all tabs as inactive, then set the new active one
  for (const t of liveState.openTabs) {
    t.isActive = false;
  }

  const newActiveTab = liveState.openTabs.find(t => t.id === activeInfo.tabId);
  if (newActiveTab) {
    newActiveTab.isActive = true;
    newActiveTab.lastActivatedAt = new Date().toISOString();

    // Record context switch event if switching between different domains
    if (previousActiveTab && previousActiveTab.id !== newActiveTab.id) {
      const fromDomain = previousActiveTab.domain;
      const toDomain = newActiveTab.domain;

      if (fromDomain && toDomain && fromDomain !== toDomain) {
        const event: ContextSwitchEvent = {
          id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fromTabTitle: previousActiveTab.title,
          toTabTitle: newActiveTab.title,
          fromDomain,
          toDomain,
          fromCategory: previousActiveTab.domainCategory || categorizeDomain(fromDomain),
          toCategory: newActiveTab.domainCategory || categorizeDomain(toDomain),
          timestamp: new Date().toISOString(),
        };

        liveState.contextSwitchEvents.push(event);
        liveState.switchesToday += 1;

        // Keep only last 50 events
        if (liveState.contextSwitchEvents.length > 50) {
          liveState.contextSwitchEvents = liveState.contextSwitchEvents.slice(-50);
        }
      }
    }
  } else {
    // Tab not in our list yet — might be a chrome:// or new tab; refresh
    await refreshAllTabs();
    return;
  }

  liveState.activeTabId = activeInfo.tabId;
  recalculate();
  debouncedSave();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.id === undefined) return;

  const existing = liveState.openTabs.find(t => t.id === tab.id);
  if (existing) {
    if (changeInfo.title) existing.title = changeInfo.title;
    if (changeInfo.url) {
      existing.url = changeInfo.url;
      existing.domain = extractDomain(changeInfo.url);
      existing.domainCategory = categorizeDomain(existing.domain);
    }
    if (changeInfo.favIconUrl) existing.favicon = changeInfo.favIconUrl;
    recalculate();
    debouncedSave();
  } else if (tab.url && !tab.url.startsWith('chrome://')) {
    // New tab we haven't seen yet
    const item = chromeTabToTabItem(tab, tab.active || false);
    liveState.openTabs.push(item);
    recalculate();
    debouncedSave();
  }
});

// ─── Window Focus Changes ───

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const activeTabs = await chrome.tabs.query({ active: true, windowId });
    if (activeTabs[0]?.id) {
      const tabId = activeTabs[0].id;
      for (const t of liveState.openTabs) {
        t.isActive = t.id === tabId;
        if (t.isActive) {
          t.lastActivatedAt = new Date().toISOString();
        }
      }
      liveState.activeTabId = tabId;
      recalculate();
      debouncedSave();
    }
  } catch (e) {
    console.warn('[ContextSwitch] Window focus change error:', e);
  }
});

// ─── Heartbeat Alarm (Time Tracking) ───

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'cs_heartbeat') return;

  // Increment time for the active tab
  const activeTab = liveState.openTabs.find(t => t.isActive);
  if (activeTab) {
    activeTab.timeSpentSeconds = (activeTab.timeSpentSeconds || 0) + 60;
  }

  // Track deep work minutes (if dominant category is development/productivity)
  const categories = liveState.openTabs.map(t => t.domainCategory || categorizeDomain(t.domain));
  const devCount = categories.filter(c => c === 'development' || c === 'productivity' || c === 'research').length;
  if (devCount > categories.length / 2) {
    liveState.deepWorkMinutes = (liveState.deepWorkMinutes || 0) + 1;
  }

  recalculate();
  forceSave();
});

// ─── Message API for Side Panel ───

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CS_GET_LIVE_STATE') {
    sendResponse({
      ...liveState,
      privacyMode: 'local_only',
      recentSessions: [],
    });
    return true;
  }

  if (message?.type === 'CS_CLEAR_CONTEXT_DATA') {
    liveState = {
      openTabs: [],
      activeTabId: null,
      contextSwitchEvents: [],
      tabGroups: [],
      contextScore: 0,
      focusState: 'Moderate Focus',
      switchesToday: 0,
      deepWorkMinutes: 0,
      sessionStartTime: new Date().toISOString(),
      lastActivityTime: new Date().toISOString(),
      activeProject: 'Detecting...',
      currentTask: 'Analyzing browser activity...',
    };
    chrome.storage.local.remove([STORAGE_KEY, 'contextswitch_state_v1']).then(() => {
      refreshAllTabs().then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message?.type === 'CS_GET_STATUS') {
    sendResponse({ status: 'active', version: '2.0.0', ready: true });
    return true;
  }

  if (message?.type === 'CS_PING') {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }

  return false;
});

export {};
