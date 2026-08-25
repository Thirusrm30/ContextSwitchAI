export interface TabItem {
  id: string | number;
  title: string;
  url: string;
  domain: string;
  category?: 'docs' | 'repo' | 'qa' | 'tool' | 'communication' | 'general';
  isActive?: boolean;
  favicon?: string;
}

export interface WorkSession {
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
}

export interface ContextState {
  activeProject: string;
  currentTask: string;
  contextScore: number;
  focusState: 'Deep Work' | 'Moderate Focus' | 'Fragmented Context' | 'High Switching';
  switchesToday: number;
  deepWorkMinutes: number;
  privacyMode: 'local_only' | 'cloud_sync_disabled';
  openTabs: TabItem[];
  recentSessions: WorkSession[];
}
