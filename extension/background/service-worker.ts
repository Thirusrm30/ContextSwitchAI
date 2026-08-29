/**
 * ContextSwitch - Background Service Worker (Manifest V3)
 * Layer 2: Real-time tab tracking, context switch detection, time tracking,
 * and live session recording with MongoDB / local storage sync.
 */

// ─── Types ───

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

interface WorkSession {
  id: string;
  projectName: string;
  currentTask: string;
  contextScore: number;
  startedAt: string;
  lastActiveAt: string;
  durationMinutes: number;
  openTabs: TabItem[];
  summary: string;
  tags: string[];
  switchCount: number;
  isCurrent?: boolean;
  suggestedNextStep?: string;
  unfinishedWork?: string;
  timeline?: Array<{
    id: string;
    time: string;
    label: string;
    description: string;
    icon: 'start' | 'tab' | 'switch' | 'debug' | 'docs' | 'code' | 'end';
    domain?: string;
  }>;
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
  recentSessions: WorkSession[];
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
  'localhost': 'development',
  '127.0.0.1': 'development',
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
      /developer\./i.test(normalized) || /docs\./i.test(normalized) ||
      /localhost/i.test(normalized) || /127\.0\.0\.1/i.test(normalized)) {
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
    general: 'General Browsing',
  };
  for (const [cat, catTabs] of Object.entries(buckets)) {
    groups.push({
      groupName: labelMap[cat] || 'General Browsing',
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
  currentTask: 'Browsing',
  recentSessions: [],
};

let excludedDomains: string[] = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SESSIONS_STORAGE_KEY = 'cs_saved_sessions_v2';
const STATE_STORAGE_KEY = 'cs_live_context_v2';
const BACKEND_API = 'http://localhost:5000/api';

// ─── Persistence & Sync ───

async function loadPersistedState(): Promise<void> {
  try {
    const result = await chrome.storage.local.get([STATE_STORAGE_KEY, SESSIONS_STORAGE_KEY, 'cs_privacy_settings']);
    if (result[STATE_STORAGE_KEY]) {
      const persisted = result[STATE_STORAGE_KEY] as LiveContextState;
      liveState.contextSwitchEvents = persisted.contextSwitchEvents || [];
      liveState.switchesToday = persisted.switchesToday || 0;
      liveState.deepWorkMinutes = persisted.deepWorkMinutes || 0;
      liveState.sessionStartTime = persisted.sessionStartTime || new Date().toISOString();
    }
    if (result[SESSIONS_STORAGE_KEY]) {
      liveState.recentSessions = result[SESSIONS_STORAGE_KEY] || [];
    }
    if (result.cs_privacy_settings?.excludedDomains) {
      excludedDomains = result.cs_privacy_settings.excludedDomains;
    }
  } catch (e) {
    console.warn('[ContextSwitch] Failed to load persisted state:', e);
  }
}

function debouncedSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({
      [STATE_STORAGE_KEY]: liveState,
      [SESSIONS_STORAGE_KEY]: liveState.recentSessions
    }).catch((e: Error) => {
      console.warn('[ContextSwitch] Save error:', e);
    });
  }, 1500);
}

function forceSave(): void {
  chrome.storage.local.set({
    [STATE_STORAGE_KEY]: liveState,
    [SESSIONS_STORAGE_KEY]: liveState.recentSessions
  }).catch((e: Error) => {
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

    const existingTimeMap = new Map<number, number>();
    for (const t of liveState.openTabs) {
      if (typeof t.id === 'number' && t.timeSpentSeconds) {
        existingTimeMap.set(t.id, t.timeSpentSeconds);
      }
    }

    liveState.openTabs = tabs
      .filter(t => t.id !== undefined && t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('edge://'))
      .map(t => {
        const item = chromeTabToTabItem(t, t.id === activeTabId);
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
  const elapsed = Math.max(1, Math.floor((Date.now() - new Date(liveState.sessionStartTime).getTime()) / 60000));
  liveState.tabGroups = groupTabsByProject(liveState.openTabs);
  liveState.contextScore = computeContextScore(
    liveState.openTabs,
    liveState.contextSwitchEvents,
    elapsed
  );
  liveState.focusState = detectFocusState(liveState.contextScore);
  liveState.lastActivityTime = new Date().toISOString();

  if (liveState.tabGroups.length > 0) {
    const sorted = [...liveState.tabGroups].sort((a, b) => b.tabs.length - a.tabs.length);
    liveState.activeProject = sorted[0].groupName;
  } else {
    liveState.activeProject = 'No Active Context';
  }

  const activeTab = liveState.openTabs.find(t => t.isActive);
  if (activeTab) {
    liveState.currentTask = activeTab.title;
  } else if (liveState.openTabs.length > 0) {
    liveState.currentTask = liveState.openTabs[0].title;
  } else {
    liveState.currentTask = 'No active tabs';
  }
}

// ─── Real Session Lifecycle ───

async function saveCurrentSessionSnapshot(customSummary?: string): Promise<WorkSession | null> {
  if (liveState.openTabs.length === 0) return null;

  const duration = Math.max(1, Math.floor((Date.now() - new Date(liveState.sessionStartTime).getTime()) / 60000));
  const activeTab = liveState.openTabs.find(t => t.isActive);

  const newSession: WorkSession = {
    id: `sess-${Date.now()}`,
    projectName: liveState.activeProject || 'General Work',
    currentTask: activeTab?.title || liveState.currentTask || 'Browsing',
    contextScore: liveState.contextScore,
    startedAt: liveState.sessionStartTime,
    lastActiveAt: 'Just now',
    durationMinutes: duration,
    openTabs: [...liveState.openTabs],
    summary: customSummary || `Worked on ${liveState.activeProject} across ${liveState.openTabs.length} tabs.`,
    tags: Array.from(new Set(liveState.openTabs.map(t => t.domainCategory || 'general'))),
    switchCount: liveState.contextSwitchEvents.length,
    isCurrent: false,
    suggestedNextStep: activeTab ? `Continue review on ${activeTab.domain}` : 'Resume open tabs',
    timeline: liveState.contextSwitchEvents.slice(-6).map((e, idx) => ({
      id: `tl-${idx}`,
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: `Switch to ${e.toCategory}`,
      description: `${e.fromDomain} -> ${e.toDomain}`,
      icon: 'switch',
      domain: e.toDomain,
    })),
  };

  // Add to local list (up to 30)
  liveState.recentSessions = [newSession, ...liveState.recentSessions.filter(s => s.id !== newSession.id)].slice(0, 30);
  forceSave();

  // Try async push to backend MongoDB
  try {
    fetch(`${BACKEND_API}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: newSession.projectName,
        task: newSession.currentTask,
        contextScore: newSession.contextScore,
        durationMinutes: newSession.durationMinutes,
        startedAt: newSession.startedAt,
        tabs: newSession.openTabs,
        summary: newSession.summary,
        suggestedNextStep: newSession.suggestedNextStep,
        tags: newSession.tags,
        switchCount: newSession.switchCount,
        timeline: newSession.timeline,
      }),
    }).catch(() => {});
  } catch {}

  return newSession;
}

// ─── Extension Install & Alarms ───

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      cs_version: '2.0.0',
      cs_initialized_at: new Date().toISOString(),
      cs_privacy_mode: 'local_only',
    });
  }
  chrome.alarms.create('cs_heartbeat', { periodInMinutes: 1 });
  refreshAllTabs();
});

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

  for (const t of liveState.openTabs) {
    t.isActive = false;
  }

  const newActiveTab = liveState.openTabs.find(t => t.id === activeInfo.tabId);
  if (newActiveTab) {
    newActiveTab.isActive = true;
    newActiveTab.lastActivatedAt = new Date().toISOString();

    if (previousActiveTab && previousActiveTab.id !== newActiveTab.id) {
      const fromDomain = previousActiveTab.domain;
      const toDomain = newActiveTab.domain;

      const isExcluded = excludedDomains.some(d => d && (fromDomain.includes(d) || toDomain.includes(d)));

      if (!isExcluded && fromDomain && toDomain && fromDomain !== toDomain) {
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

        if (liveState.contextSwitchEvents.length > 50) {
          liveState.contextSwitchEvents = liveState.contextSwitchEvents.slice(-50);
        }
      }
    }
  } else {
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
    const item = chromeTabToTabItem(tab, tab.active || false);
    liveState.openTabs.push(item);
    recalculate();
    debouncedSave();
  }
});

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

// ─── Heartbeat Alarm (Time Tracking & Periodic Snapshots) ───

let heartbeatMinutesCount = 0;

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'cs_heartbeat') return;

  const activeTab = liveState.openTabs.find(t => t.isActive);
  if (activeTab) {
    activeTab.timeSpentSeconds = (activeTab.timeSpentSeconds || 0) + 60;
  }

  const categories = liveState.openTabs.map(t => t.domainCategory || categorizeDomain(t.domain));
  const devCount = categories.filter(c => c === 'development' || c === 'productivity' || c === 'research').length;
  if (devCount > categories.length / 2) {
    liveState.deepWorkMinutes = (liveState.deepWorkMinutes || 0) + 1;
  }

  heartbeatMinutesCount++;

  // Auto-record session checkpoint every 10 minutes if tabs are active
  if (heartbeatMinutesCount % 10 === 0 && liveState.openTabs.length > 0) {
    saveCurrentSessionSnapshot();
  }

  recalculate();
  forceSave();
});

// ─── Side Panel & Extension Messaging ───

if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CS_GET_LIVE_STATE') {
    sendResponse({
      ...liveState,
      privacyMode: 'local_only',
    });
    return true;
  }

  if (message?.type === 'CS_SAVE_SNAPSHOT') {
    saveCurrentSessionSnapshot(message.summary).then(session => {
      sendResponse({ success: true, session });
    });
    return true;
  }

  if (message?.type === 'CS_DELETE_SESSION') {
    if (message.sessionId) {
      liveState.recentSessions = liveState.recentSessions.filter(s => s.id !== message.sessionId);
      forceSave();
      sendResponse({ success: true });
    }
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
      activeProject: 'No Active Context',
      currentTask: 'No active tabs',
      recentSessions: [],
    };
    chrome.storage.local.remove([STATE_STORAGE_KEY, SESSIONS_STORAGE_KEY, 'contextswitch_state_v1']).then(() => {
      refreshAllTabs().then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message?.type === 'CS_UPDATE_EXCLUDED_DOMAINS') {
    if (Array.isArray(message.excludedDomains)) {
      excludedDomains = message.excludedDomains;
    }
    sendResponse({ success: true });
    return true;
  }

  if (message?.type === 'CS_GET_STATUS') {
    sendResponse({ status: 'active', version: '2.0.0', ready: true });
    return true;
  }

  return false;
});

export {};
