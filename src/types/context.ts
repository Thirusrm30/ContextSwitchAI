// ─── Domain Categories ───
export type DomainCategory =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'entertainment'
  | 'research'
  | 'social'
  | 'general';

// ─── Tab Item ───
export interface TabItem {
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

// ─── Context Switch Event ───
export interface ContextSwitchEvent {
  id: string;
  fromTabTitle: string;
  toTabTitle: string;
  fromDomain: string;
  toDomain: string;
  fromCategory: DomainCategory;
  toCategory: DomainCategory;
  timestamp: string;
}

// ─── Tab Group (auto-detected project cluster) ───
export interface TabGroup {
  groupName: string;
  tabs: TabItem[];
  primaryCategory: DomainCategory;
  confidence: number;
}

// ─── Work Session ───
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

// ─── AI Context Result ───
export interface AIContextResult {
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

// ─── AI Processing Mode ───
export type AIProcessingMode = 'local_only' | 'cloud_ai';

// ─── AI Settings ───
export interface AISettings {
  processingMode: AIProcessingMode;
  apiKey?: string;
  excludedDomains: string[];
  autoAnalyze: boolean;
}

// ─── Sanitized Tab (privacy-safe for AI) ───
export interface SanitizedTab {
  domain: string;
  title: string;
  isActive: boolean;
  domainCategory: DomainCategory;
  timeSpentSeconds: number;
}

// ─── AI Analysis Input ───
export interface AIAnalysisInput {
  tabs: SanitizedTab[];
  recentSwitches: Array<{
    fromDomain: string;
    toDomain: string;
    fromCategory: DomainCategory;
    toCategory: DomainCategory;
    timestamp: string;
  }>;
  sessionDurationMinutes: number;
  dominantCategory: DomainCategory;
}

// ─── AI Summary Input ───
export interface AISummaryInput {
  tabs: SanitizedTab[];
  sessionDurationMinutes: number;
  switchCount: number;
  dominantCategory: DomainCategory;
}

// ─── Full Context State ───
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
  contextSwitchEvents: ContextSwitchEvent[];
  tabGroups: TabGroup[];
  sessionStartTime: string;
  lastActivityTime: string;
  aiContext?: AIContextResult;
  aiSettings?: AISettings;
}
