/**
 * ContextSwitch — Context Engine (Pure Logic)
 * Layer 2: Domain categorization, tab grouping, score computation.
 * No direct Chrome API calls — receives processed data.
 */

import { TabItem, DomainCategory, TabGroup, ContextSwitchEvent } from '../types/context';

// ─── Domain → Category Rule Map ───

const DOMAIN_RULES: Record<string, DomainCategory> = {
  // Development
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
  'heroku.com': 'development',
  'aws.amazon.com': 'development',
  'cloud.google.com': 'development',
  'portal.azure.com': 'development',
  'docker.com': 'development',
  'hub.docker.com': 'development',
  'pypi.org': 'development',
  'crates.io': 'development',
  'docs.rs': 'development',
  'prisma.io': 'development',
  'socket.io': 'development',
  'rxjs.dev': 'development',
  'tailwindcss.com': 'development',
  'stripe.com': 'development',
  'dev.to': 'development',

  // Productivity
  'docs.google.com': 'productivity',
  'sheets.google.com': 'productivity',
  'slides.google.com': 'productivity',
  'notion.so': 'productivity',
  'trello.com': 'productivity',
  'figma.com': 'productivity',
  'jira.atlassian.net': 'productivity',
  'confluence.atlassian.net': 'productivity',
  'asana.com': 'productivity',
  'clickup.com': 'productivity',
  'monday.com': 'productivity',
  'miro.com': 'productivity',
  'airtable.com': 'productivity',
  'calendar.google.com': 'productivity',
  'drive.google.com': 'productivity',
  'dropbox.com': 'productivity',
  'evernote.com': 'productivity',
  'excalidraw.com': 'productivity',
  'canva.com': 'productivity',

  // Communication
  'gmail.com': 'communication',
  'mail.google.com': 'communication',
  'outlook.com': 'communication',
  'outlook.live.com': 'communication',
  'outlook.office.com': 'communication',
  'slack.com': 'communication',
  'discord.com': 'communication',
  'teams.microsoft.com': 'communication',
  'zoom.us': 'communication',
  'meet.google.com': 'communication',
  'web.whatsapp.com': 'communication',
  'web.telegram.org': 'communication',

  // Entertainment
  'youtube.com': 'entertainment',
  'netflix.com': 'entertainment',
  'twitch.tv': 'entertainment',
  'spotify.com': 'entertainment',
  'open.spotify.com': 'entertainment',
  'music.youtube.com': 'entertainment',
  'primevideo.com': 'entertainment',
  'disneyplus.com': 'entertainment',
  'hulu.com': 'entertainment',

  // Research
  'scholar.google.com': 'research',
  'arxiv.org': 'research',
  'wikipedia.org': 'research',
  'medium.com': 'research',
  'pubmed.ncbi.nlm.nih.gov': 'research',
  'researchgate.net': 'research',
  'semanticscholar.org': 'research',
  'jstor.org': 'research',

  // Social
  'twitter.com': 'social',
  'x.com': 'social',
  'facebook.com': 'social',
  'instagram.com': 'social',
  'linkedin.com': 'social',
  'reddit.com': 'social',
  'threads.net': 'social',
  'tiktok.com': 'social',
  'pinterest.com': 'social',
};

// Subdomain-aware keyword patterns for domains not in the exact map
const DOMAIN_KEYWORD_RULES: Array<{ pattern: RegExp; category: DomainCategory }> = [
  { pattern: /github\.io$/i, category: 'development' },
  { pattern: /\.dev$/i, category: 'development' },
  { pattern: /developer\./i, category: 'development' },
  { pattern: /api\./i, category: 'development' },
  { pattern: /docs\./i, category: 'development' },
  { pattern: /console\./i, category: 'development' },
  { pattern: /classroom\.google\.com/i, category: 'productivity' },
];

/**
 * Categorize a domain string into a DomainCategory
 */
export function categorizeDomain(domain: string): DomainCategory {
  if (!domain) return 'general';

  const normalized = domain.toLowerCase().replace(/^www\./, '');

  // 1. Exact match
  if (DOMAIN_RULES[normalized]) {
    return DOMAIN_RULES[normalized];
  }

  // 2. Check parent domain (e.g. "en.wikipedia.org" → "wikipedia.org")
  const parts = normalized.split('.');
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.');
    if (DOMAIN_RULES[parentDomain]) {
      return DOMAIN_RULES[parentDomain];
    }
  }

  // 3. Keyword / pattern match
  for (const rule of DOMAIN_KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.category;
    }
  }

  return 'general';
}

/**
 * Map DomainCategory to the existing legacy TabItem.category for backward-compat
 */
export function domainCategoryToLegacy(dc: DomainCategory): TabItem['category'] {
  switch (dc) {
    case 'development': return 'repo';
    case 'research': return 'docs';
    case 'productivity': return 'tool';
    case 'communication': return 'communication';
    default: return 'general';
  }
}

/**
 * Extract domain from a URL string
 */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Group open tabs into suggested project clusters.
 *
 * Heuristic: tabs that share the same primary development-related domain
 * (e.g. github.com, firebase.google.com) or are categorized similarly
 * get clustered together. Remaining ungrouped tabs go into "Other Browsing".
 */
export function groupTabsByProject(tabs: TabItem[]): TabGroup[] {
  if (tabs.length === 0) return [];

  // Step 1: Build domain adjacency clusters
  // Group tabs by their root-level "project signal" domain
  const projectSignalDomains = new Map<string, TabItem[]>();
  const ungrouped: TabItem[] = [];

  for (const tab of tabs) {
    const dc = tab.domainCategory || categorizeDomain(tab.domain);

    // Development and research tabs are strong project signals
    if (dc === 'development' || dc === 'research' || dc === 'productivity') {
      const key = tab.domain;
      if (!projectSignalDomains.has(key)) {
        projectSignalDomains.set(key, []);
      }
      projectSignalDomains.get(key)!.push(tab);
    } else {
      ungrouped.push(tab);
    }
  }

  // Step 2: Merge small clusters that share a category
  const groups: TabGroup[] = [];
  const devTabs: TabItem[] = [];
  const prodTabs: TabItem[] = [];
  const resTabs: TabItem[] = [];

  for (const [, domainTabs] of projectSignalDomains) {
    const cat = domainTabs[0]?.domainCategory || categorizeDomain(domainTabs[0]?.domain || '');
    if (cat === 'development') {
      devTabs.push(...domainTabs);
    } else if (cat === 'productivity') {
      prodTabs.push(...domainTabs);
    } else if (cat === 'research') {
      resTabs.push(...domainTabs);
    }
  }

  if (devTabs.length > 0) {
    groups.push({
      groupName: 'Development',
      tabs: devTabs,
      primaryCategory: 'development',
      confidence: Math.min(95, 60 + devTabs.length * 8),
    });
  }

  if (prodTabs.length > 0) {
    groups.push({
      groupName: 'Productivity',
      tabs: prodTabs,
      primaryCategory: 'productivity',
      confidence: Math.min(90, 55 + prodTabs.length * 10),
    });
  }

  if (resTabs.length > 0) {
    groups.push({
      groupName: 'Research',
      tabs: resTabs,
      primaryCategory: 'research',
      confidence: Math.min(90, 55 + resTabs.length * 10),
    });
  }

  if (ungrouped.length > 0) {
    // Sub-group by category
    const commTabs = ungrouped.filter(t => (t.domainCategory || categorizeDomain(t.domain)) === 'communication');
    const entTabs = ungrouped.filter(t => (t.domainCategory || categorizeDomain(t.domain)) === 'entertainment');
    const socTabs = ungrouped.filter(t => (t.domainCategory || categorizeDomain(t.domain)) === 'social');
    const otherTabs = ungrouped.filter(t => {
      const c = t.domainCategory || categorizeDomain(t.domain);
      return c !== 'communication' && c !== 'entertainment' && c !== 'social';
    });

    if (commTabs.length > 0) {
      groups.push({
        groupName: 'Communication',
        tabs: commTabs,
        primaryCategory: 'communication',
        confidence: Math.min(85, 60 + commTabs.length * 8),
      });
    }
    if (entTabs.length > 0) {
      groups.push({
        groupName: 'Entertainment',
        tabs: entTabs,
        primaryCategory: 'entertainment',
        confidence: Math.min(85, 60 + entTabs.length * 8),
      });
    }
    if (socTabs.length > 0) {
      groups.push({
        groupName: 'Social',
        tabs: socTabs,
        primaryCategory: 'social',
        confidence: Math.min(85, 60 + socTabs.length * 8),
      });
    }
    if (otherTabs.length > 0) {
      groups.push({
        groupName: 'Other Browsing',
        tabs: otherTabs,
        primaryCategory: 'general',
        confidence: 40,
      });
    }
  }

  return groups;
}

/**
 * Compute a context/focus score (0–100) from:
 * - Category coherence of open tabs
 * - Context switch frequency
 * - Active session duration
 */
export function computeContextScore(
  tabs: TabItem[],
  switchEvents: ContextSwitchEvent[],
  activeMinutes: number
): number {
  if (tabs.length === 0) return 0;

  // 1. Category coherence (0–40 points)
  const categories = tabs.map(t => t.domainCategory || categorizeDomain(t.domain));
  const categoryCount = new Map<DomainCategory, number>();
  for (const c of categories) {
    categoryCount.set(c, (categoryCount.get(c) || 0) + 1);
  }
  const dominantCount = Math.max(...categoryCount.values());
  const coherenceRatio = dominantCount / tabs.length;
  const coherenceScore = Math.round(coherenceRatio * 40);

  // 2. Switch frequency penalty (0–30 points, lower switches = higher score)
  const recentSwitches = switchEvents.filter(e => {
    const diff = Date.now() - new Date(e.timestamp).getTime();
    return diff < 30 * 60 * 1000; // last 30 minutes
  }).length;
  const switchPenalty = Math.min(recentSwitches * 3, 30);
  const switchScore = 30 - switchPenalty;

  // 3. Session duration bonus (0–30 points)
  const durationScore = Math.min(30, Math.round(activeMinutes * 0.6));

  return Math.max(0, Math.min(100, coherenceScore + switchScore + durationScore));
}

/**
 * Map a numeric context score to a human-readable focus state.
 */
export function detectFocusState(score: number): 'Deep Work' | 'Moderate Focus' | 'Fragmented Context' | 'High Switching' {
  if (score >= 80) return 'Deep Work';
  if (score >= 60) return 'Moderate Focus';
  if (score >= 35) return 'Fragmented Context';
  return 'High Switching';
}

/**
 * Get a human-readable label and color for a DomainCategory.
 */
export function getCategoryDisplay(category: DomainCategory): { label: string; colorClass: string } {
  switch (category) {
    case 'development':
      return { label: 'Development', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'productivity':
      return { label: 'Productivity', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    case 'communication':
      return { label: 'Communication', colorClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
    case 'entertainment':
      return { label: 'Entertainment', colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    case 'research':
      return { label: 'Research', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'social':
      return { label: 'Social', colorClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
    default:
      return { label: 'General', colorClass: 'bg-slate-700/40 text-slate-300 border-slate-600/30' };
  }
}
