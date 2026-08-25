/**
 * ContextSwitch — Privacy Sanitizer
 * Layer 3: Sanitizes browser data before it reaches any AI provider.
 *
 * Rules:
 * - Only pass domain + page title (never full URLs)
 * - Strip query parameters
 * - Remove chrome://, chrome-extension://, about: URLs
 * - Filter excluded domains
 * - Never collect passwords or form values
 */

import { TabItem, SanitizedTab, ContextSwitchEvent, DomainCategory } from '../types/context';
import { categorizeDomain } from './contextEngine';

/** URLs that should never be sent to any AI provider */
const BLOCKED_URL_PATTERNS = [
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^about:/i,
  /^edge:\/\//i,
  /^brave:\/\//i,
  /^file:\/\//i,
  /^data:/i,
  /^javascript:/i,
  /^devtools:\/\//i,
];

/** Sensitive title patterns that should be redacted */
const SENSITIVE_TITLE_PATTERNS = [
  /password/i,
  /reset.*password/i,
  /credit.?card/i,
  /social.?security/i,
  /bank.?account/i,
  /payment.?method/i,
  /checkout/i,
];

/**
 * Strip query parameters from a title string if it looks like it contains URL fragments
 */
function sanitizeTitle(title: string): string {
  if (!title) return 'Untitled';

  // Check against sensitive patterns
  for (const pattern of SENSITIVE_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      return '[Sensitive Page]';
    }
  }

  // Remove anything that looks like a URL in the title
  let cleaned = title.replace(/https?:\/\/\S+/g, '[url]');

  // Remove query-string-like fragments from titles
  cleaned = cleaned.replace(/\?[^\s]*/g, '');

  // Trim excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || 'Untitled';
}

/**
 * Check if a URL matches any blocked pattern
 */
function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Sanitize an array of TabItems for AI processing.
 * Returns privacy-safe SanitizedTab objects.
 */
export function sanitizeTabsForAI(
  tabs: TabItem[],
  excludedDomains: string[] = []
): SanitizedTab[] {
  const excludeSet = new Set(excludedDomains.map(d => d.toLowerCase().trim()));

  return tabs
    .filter(tab => {
      // Filter out blocked URLs
      if (isBlockedUrl(tab.url)) return false;

      // Filter out excluded domains
      if (tab.domain && excludeSet.has(tab.domain.toLowerCase())) return false;

      // Filter out empty domains
      if (!tab.domain) return false;

      return true;
    })
    .map(tab => ({
      domain: tab.domain,
      title: sanitizeTitle(tab.title),
      isActive: tab.isActive || false,
      domainCategory: tab.domainCategory || categorizeDomain(tab.domain),
      timeSpentSeconds: tab.timeSpentSeconds || 0,
    }));
}

/**
 * Sanitize context switch events for AI — only domain + category, no URLs
 */
export function sanitizeSwitchEventsForAI(
  events: ContextSwitchEvent[],
  maxEvents = 10
): Array<{
  fromDomain: string;
  toDomain: string;
  fromCategory: DomainCategory;
  toCategory: DomainCategory;
  timestamp: string;
}> {
  return events.slice(-maxEvents).map(e => ({
    fromDomain: e.fromDomain,
    toDomain: e.toDomain,
    fromCategory: e.fromCategory,
    toCategory: e.toCategory,
    timestamp: e.timestamp,
  }));
}
