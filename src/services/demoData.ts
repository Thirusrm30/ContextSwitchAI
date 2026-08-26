import { ContextState, TabItem, WorkSession, ProjectHistory, SessionTimelineEvent } from '../types/context';

const DEMO_TABS_GITHUB: TabItem[] = [
  {
    id: 'demo-1',
    title: 'GitHub — smart-civic-reporter / src / auth / AuthMiddleware.ts',
    url: 'https://github.com/civic-reporter/core-app/blob/main/src/auth/middleware.ts',
    domain: 'github.com',
    category: 'repo',
    domainCategory: 'development',
    isActive: true,
    timeSpentSeconds: 340,
    lastActivatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'GitHub — smart-civic-reporter / Issues / #42 OAuth token refresh',
    url: 'https://github.com/civic-reporter/core-app/issues/42',
    domain: 'github.com',
    category: 'repo',
    domainCategory: 'development',
    isActive: false,
    timeSpentSeconds: 120,
  },
];

const DEMO_TABS_FIREBASE: TabItem[] = [
  {
    id: 'demo-3',
    title: 'Firebase Docs — Authenticate with Custom Claims',
    url: 'https://firebase.google.com/docs/auth/admin/custom-claims',
    domain: 'firebase.google.com',
    category: 'docs',
    domainCategory: 'development',
    isActive: true,
    timeSpentSeconds: 420,
    lastActivatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Firebase Console — Authentication / Sign-in method',
    url: 'https://console.firebase.google.com/project/smart-civic-reporter/authentication/providers',
    domain: 'console.firebase.google.com',
    category: 'tool',
    domainCategory: 'development',
    isActive: false,
    timeSpentSeconds: 180,
  },
];

const DEMO_TABS_SO: TabItem[] = [
  {
    id: 'demo-5',
    title: 'Stack Overflow — Refreshing Firebase Auth ID tokens automatically',
    url: 'https://stackoverflow.com/questions/63219481/firebase-auth-token-refresh-strategy',
    domain: 'stackoverflow.com',
    category: 'qa',
    domainCategory: 'development',
    isActive: true,
    timeSpentSeconds: 95,
  },
];

const DEMO_TABS_LOCALHOST: TabItem[] = [
  {
    id: 'demo-6',
    title: 'localhost:3000 — Smart Civic Reporter Dashboard',
    url: 'http://localhost:3000',
    domain: 'localhost',
    category: 'tool',
    domainCategory: 'development',
    isActive: true,
    timeSpentSeconds: 600,
    lastActivatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    title: 'localhost:3000 — Login Page (OAuth flow testing)',
    url: 'http://localhost:3000/login',
    domain: 'localhost',
    category: 'tool',
    domainCategory: 'development',
    isActive: false,
    timeSpentSeconds: 240,
  },
];

const DEMO_TABS_REACT: TabItem[] = [
  {
    id: 'demo-8',
    title: 'React Docs — useEffect and cleanup subscriptions',
    url: 'https://react.dev/reference/react/useEffect',
    domain: 'react.dev',
    category: 'docs',
    domainCategory: 'development',
    isActive: false,
    timeSpentSeconds: 190,
  },
];

export const DEMO_TIMELINE: SessionTimelineEvent[] = [
  {
    id: 'dtl-1',
    time: '10:15',
    label: 'Started session',
    description: 'Opened Firebase authentication documentation',
    icon: 'start',
    domain: 'firebase.google.com',
  },
  {
    id: 'dtl-2',
    time: '10:22',
    label: 'Opened GitHub',
    description: 'Reviewed AuthMiddleware.ts implementation',
    icon: 'code',
    domain: 'github.com',
  },
  {
    id: 'dtl-3',
    time: '10:35',
    label: 'Firebase Console',
    description: 'Configured Google OAuth sign-in provider',
    icon: 'tab',
    domain: 'console.firebase.google.com',
  },
  {
    id: 'dtl-4',
    time: '10:48',
    label: 'Debugged OAuth flow',
    description: 'Checked useEffect cleanup for token refresh',
    icon: 'debug',
    domain: 'react.dev',
  },
  {
    id: 'dtl-5',
    time: '11:02',
    label: 'Researched token strategy',
    description: 'Found solution on Stack Overflow',
    icon: 'docs',
    domain: 'stackoverflow.com',
  },
  {
    id: 'dtl-6',
    time: '11:15',
    label: 'Tested locally',
    description: 'OAuth flow working on localhost:3000',
    icon: 'code',
    domain: 'localhost',
  },
];

export const DEMO_SESSION: WorkSession = {
  id: 'demo-sess-1',
  projectName: 'Smart Civic Reporter',
  currentTask: 'Firebase Authentication',
  contextScore: 87,
  startedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  lastActiveAt: '12 minutes ago',
  durationMinutes: 65,
  openTabs: [...DEMO_TABS_FIREBASE, ...DEMO_TABS_GITHUB, ...DEMO_TABS_SO, ...DEMO_TABS_LOCALHOST, ...DEMO_TABS_REACT],
  summary: 'Configuring Firebase token validation in Next.js middleware. Set up Google OAuth provider, implemented custom claims for role-based access, and tested the full sign-in flow on localhost.',
  tags: ['Auth', 'Firebase', 'React', 'OAuth', 'Security'],
  switchCount: 5,
  isCurrent: true,
  suggestedNextStep: 'Configure the Google OAuth provider in Firebase Console and test the complete sign-in flow end-to-end.',
  unfinishedWork: 'Google OAuth consent screen needs production URLs. Token refresh logic has a race condition on rapid tab switching.',
  timeline: DEMO_TIMELINE,
};

export const DEMO_SESSION_2: WorkSession = {
  id: 'demo-sess-2',
  projectName: 'FinTrack AI Dashboard',
  currentTask: 'Stripe Webhook Integration',
  contextScore: 92,
  startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  lastActiveAt: '3 hours ago',
  durationMinutes: 74,
  openTabs: [
    { id: 'demo-ft-1', title: 'Stripe Docs — Handling Webhooks', url: 'https://stripe.com/docs/webhooks', domain: 'stripe.com', category: 'docs', domainCategory: 'development' },
    { id: 'demo-ft-2', title: 'GitHub — fintrack-ai / stripe-handler.ts', url: 'https://github.com/fintrack/api/pull/42', domain: 'github.com', category: 'repo', domainCategory: 'development' },
  ],
  summary: 'Resolved race condition in customer subscription renewal events and idempotency keys.',
  tags: ['Payments', 'Stripe', 'NodeJS'],
  switchCount: 1,
  isCurrent: false,
  suggestedNextStep: 'Write unit tests for the idempotency key validation logic.',
  unfinishedWork: 'Webhook retry logic needs a dead-letter queue.',
  timeline: [
    { id: 'dtl-ft-1', time: '07:10', label: 'Started session', description: 'Opened Stripe webhook docs', icon: 'start', domain: 'stripe.com' },
    { id: 'dtl-ft-2', time: '07:22', label: 'Code review', description: 'Reviewed PR #42', icon: 'code', domain: 'github.com' },
  ],
};

export const DEMO_PROJECT_HISTORY: ProjectHistory[] = [
  {
    id: 'ph-demo-1',
    projectName: 'Smart Civic Reporter',
    lastActiveAt: '12 minutes ago',
    sessionCount: 12,
    currentTask: 'Firebase Authentication',
    totalTabsOpened: 47,
    averageContextScore: 84,
    tags: ['Auth', 'Firebase', 'React', 'Next.js'],
    sessions: [DEMO_SESSION],
  },
  {
    id: 'ph-demo-2',
    projectName: 'College Assignment',
    lastActiveAt: '2 days ago',
    sessionCount: 8,
    currentTask: 'Research Paper on ML Models',
    totalTabsOpened: 31,
    averageContextScore: 72,
    tags: ['Research', 'ML', 'Python'],
    sessions: [],
  },
  {
    id: 'ph-demo-3',
    projectName: 'Portfolio',
    lastActiveAt: '4 days ago',
    sessionCount: 5,
    currentTask: 'Hero Section Animation',
    totalTabsOpened: 18,
    averageContextScore: 91,
    tags: ['Frontend', 'CSS', 'GSAP'],
    sessions: [],
  },
  {
    id: 'ph-demo-4',
    projectName: 'Research',
    lastActiveAt: '1 week ago',
    sessionCount: 3,
    currentTask: 'Quantum Computing Survey',
    totalTabsOpened: 22,
    averageContextScore: 68,
    tags: ['Academic', 'arXiv', 'Physics'],
    sessions: [],
  },
];

export function getDemoContextState(): ContextState {
  return {
    activeProject: 'Smart Civic Reporter',
    currentTask: 'Firebase Authentication',
    contextScore: 87,
    focusState: 'Deep Work',
    switchesToday: 5,
    deepWorkMinutes: 65,
    privacyMode: 'local_only',
    openTabs: [...DEMO_TABS_FIREBASE, ...DEMO_TABS_GITHUB, ...DEMO_TABS_SO, ...DEMO_TABS_LOCALHOST, ...DEMO_TABS_REACT],
    recentSessions: [DEMO_SESSION, DEMO_SESSION_2],
    contextSwitchEvents: [
      {
        id: 'dcs-1',
        fromTabTitle: 'Firebase Docs — Authenticate with Custom Claims',
        toTabTitle: 'GitHub — AuthMiddleware.ts',
        fromDomain: 'firebase.google.com',
        toDomain: 'github.com',
        fromCategory: 'development',
        toCategory: 'development',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      },
      {
        id: 'dcs-2',
        fromTabTitle: 'GitHub — AuthMiddleware.ts',
        toTabTitle: 'Firebase Console — Authentication',
        fromDomain: 'github.com',
        toDomain: 'console.firebase.google.com',
        fromCategory: 'development',
        toCategory: 'development',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
      {
        id: 'dcs-3',
        fromTabTitle: 'Firebase Console — Authentication',
        toTabTitle: 'React Docs — useEffect',
        fromDomain: 'console.firebase.google.com',
        toDomain: 'react.dev',
        fromCategory: 'development',
        toCategory: 'development',
        timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      },
      {
        id: 'dcs-4',
        fromTabTitle: 'React Docs — useEffect',
        toTabTitle: 'Stack Overflow — Firebase token refresh',
        fromDomain: 'react.dev',
        toDomain: 'stackoverflow.com',
        fromCategory: 'development',
        toCategory: 'development',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'dcs-5',
        fromTabTitle: 'Stack Overflow — Firebase token refresh',
        toTabTitle: 'localhost:3000 — Dashboard',
        fromDomain: 'stackoverflow.com',
        toDomain: 'localhost',
        fromCategory: 'development',
        toCategory: 'development',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
    ],
    tabGroups: [
      {
        groupName: 'Development',
        tabs: [...DEMO_TABS_FIREBASE, ...DEMO_TABS_GITHUB, ...DEMO_TABS_SO, ...DEMO_TABS_LOCALHOST, ...DEMO_TABS_REACT],
        primaryCategory: 'development',
        confidence: 94,
      },
    ],
    sessionStartTime: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    lastActivityTime: new Date().toISOString(),
    projectHistory: DEMO_PROJECT_HISTORY,
    privacySettings: {
      historyEnabled: true,
      excludedDomains: [],
      deleteSessionOnDemand: true,
      clearAllOnExit: false,
    },
  };
}

// Demo scenario steps for the interactive walkthrough
export interface DemoStep {
  title: string;
  description: string;
  tabs: TabItem[];
  project: string;
  task: string;
  score: number;
  focusState: 'Deep Work' | 'Moderate Focus' | 'Fragmented Context' | 'High Switching';
}

export const DEMO_SCENARIO: DemoStep[] = [
  {
    title: '1. Open GitHub',
    description: 'You start working on Smart Civic Reporter. Opening the auth middleware on GitHub.',
    tabs: DEMO_TABS_GITHUB,
    project: 'Smart Civic Reporter',
    task: 'Reviewing auth middleware',
    score: 65,
    focusState: 'Moderate Focus',
  },
  {
    title: '2. Open Firebase Docs',
    description: 'Switching to Firebase documentation to check custom claims setup.',
    tabs: [...DEMO_TABS_GITHUB, ...DEMO_TABS_FIREBASE],
    project: 'Smart Civic Reporter',
    task: 'Firebase Authentication',
    score: 78,
    focusState: 'Moderate Focus',
  },
  {
    title: '3. Search Stack Overflow',
    description: 'Need help with token refresh strategy. Context stays focused.',
    tabs: [...DEMO_TABS_GITHUB, ...DEMO_TABS_FIREBASE, ...DEMO_TABS_SO],
    project: 'Smart Civic Reporter',
    task: 'Firebase Authentication',
    score: 85,
    focusState: 'Deep Work',
  },
  {
    title: '4. Test on localhost',
    description: 'OAuth flow is working locally! All tabs aligned to one project.',
    tabs: [...DEMO_TABS_GITHUB, ...DEMO_TABS_FIREBASE, ...DEMO_TABS_SO, ...DEMO_TABS_LOCALHOST],
    project: 'Smart Civic Reporter',
    task: 'Testing OAuth flow',
    score: 91,
    focusState: 'Deep Work',
  },
  {
    title: '5. Context Saved',
    description: 'You switch to a different activity. ContextSwitch saves your session automatically.',
    tabs: [],
    project: 'Smart Civic Reporter',
    task: 'Firebase Authentication',
    score: 87,
    focusState: 'Deep Work',
  },
  {
    title: '6. Resume My Work',
    description: 'You return and click "Resume My Work". ContextSwitch restores your tabs and context.',
    tabs: [...DEMO_TABS_FIREBASE, ...DEMO_TABS_GITHUB, ...DEMO_TABS_SO, ...DEMO_TABS_LOCALHOST, ...DEMO_TABS_REACT],
    project: 'Smart Civic Reporter',
    task: 'Firebase Authentication',
    score: 87,
    focusState: 'Deep Work',
  },
];
