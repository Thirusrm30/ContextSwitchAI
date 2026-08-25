/**
 * ContextSwitch — Local Fallback AI Provider
 * Layer 3: Rule-based context analysis that works entirely offline.
 *
 * No API key needed. Always available as fallback.
 */

import { AIProvider } from './aiProvider';
import { AIContextResult, AIAnalysisInput, AISummaryInput, DomainCategory, SanitizedTab } from '../../types/context';

export class LocalFallbackProvider implements AIProvider {
  readonly name = 'Local Analysis (Offline)';
  readonly requiresApiKey = false;

  async analyzeContext(input: AIAnalysisInput): Promise<AIContextResult> {
    const { tabs, sessionDurationMinutes, dominantCategory } = input;

    if (tabs.length === 0) {
      return {
        project: 'No Active Project',
        task: 'No tabs open',
        confidence: 0,
        category: 'general',
        distraction: false,
        summary: 'No browser activity detected.',
        nextAction: 'Open a tab to start working.',
        analyzedAt: new Date().toISOString(),
      };
    }

    const project = this.detectProject(tabs);
    const task = this.detectTask(tabs);
    const distraction = this.detectDistraction(tabs, dominantCategory);
    const confidence = this.computeConfidence(tabs, dominantCategory);
    const summary = this.buildSummary(tabs, sessionDurationMinutes, dominantCategory);
    const nextAction = this.suggestNextAction(tabs, dominantCategory, distraction.isDistraction);

    return {
      project,
      task,
      confidence,
      category: dominantCategory,
      distraction: distraction.isDistraction,
      distractionReason: distraction.reason,
      summary,
      nextAction,
      analyzedAt: new Date().toISOString(),
    };
  }

  async generateSummary(input: AISummaryInput): Promise<string> {
    const { tabs, sessionDurationMinutes, switchCount, dominantCategory } = input;

    const domainSet = new Set(tabs.map(t => t.domain));
    const activeTab = tabs.find(t => t.isActive);
    const topDomains = this.getTopDomains(tabs, 5);

    const parts: string[] = [];

    // What user worked on
    const catLabel = this.categoryLabel(dominantCategory);
    parts.push(`Session focused on ${catLabel} activities for ${sessionDurationMinutes} minutes.`);

    // Important resources
    if (topDomains.length > 0) {
      parts.push(`Key resources: ${topDomains.join(', ')}.`);
    }

    // Activities observed
    parts.push(`${domainSet.size} unique domains visited across ${tabs.length} tabs.`);
    if (switchCount > 0) {
      parts.push(`${switchCount} context switches detected.`);
    }

    // Current focus
    if (activeTab) {
      parts.push(`Last active on: ${activeTab.title} (${activeTab.domain}).`);
    }

    // Possible unfinished task
    const devTabs = tabs.filter(t => t.domainCategory === 'development' || t.domainCategory === 'research');
    if (devTabs.length > 0) {
      const mostTimeTab = devTabs.sort((a, b) => (b.timeSpentSeconds || 0) - (a.timeSpentSeconds || 0))[0];
      parts.push(`Possible unfinished work: "${mostTimeTab.title}" (${Math.floor((mostTimeTab.timeSpentSeconds || 0) / 60)}m spent).`);
    }

    return parts.join(' ');
  }

  // ─── Internal Heuristics ───

  private detectProject(tabs: SanitizedTab[]): string {
    // Try to extract project name from GitHub repo tabs
    for (const tab of tabs) {
      if (tab.domain === 'github.com') {
        // Common patterns: "user/repo-name", "Organization/RepoName — Pull Request"
        const match = tab.title.match(/^(?:GitHub\s*[-—]\s*)?(\S+\/\S+)/i);
        if (match) {
          const repoName = match[1].split('/').pop() || match[1];
          return this.formatProjectName(repoName);
        }

        // Pattern: "repo-name/path — GitHub"
        const match2 = tab.title.match(/^([^/\s]+)\s*[/—-]/);
        if (match2) {
          return this.formatProjectName(match2[1]);
        }
      }
    }

    // Try to detect from localhost tabs
    for (const tab of tabs) {
      if (tab.domain === 'localhost' || tab.domain.startsWith('127.0.0.1')) {
        const titleParts = tab.title.split(/[-|–—]/);
        if (titleParts.length > 0 && titleParts[0].trim().length > 2) {
          return titleParts[0].trim();
        }
      }
    }

    // Fall back to dominant category label
    const categories = tabs.map(t => t.domainCategory);
    const counts = new Map<DomainCategory, number>();
    for (const c of categories) counts.set(c, (counts.get(c) || 0) + 1);
    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    return `${this.categoryLabel(dominant)} Project`;
  }

  private detectTask(tabs: SanitizedTab[]): string {
    // Active tab title is the strongest signal for current task
    const active = tabs.find(t => t.isActive);
    if (active) {
      // Clean up common suffixes
      let title = active.title
        .replace(/\s*[-—|]\s*(GitHub|Stack Overflow|Google|YouTube|Firebase|MDN|React).*$/i, '')
        .trim();
      if (title.length > 60) title = title.substring(0, 57) + '...';
      return title || active.domain;
    }

    // Fallback: most recently used tab
    const sorted = [...tabs].sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds);
    if (sorted[0]) {
      return sorted[0].title.substring(0, 60);
    }

    return 'Browsing';
  }

  private detectDistraction(
    tabs: SanitizedTab[],
    dominantCategory: DomainCategory
  ): { isDistraction: boolean; reason?: string } {
    const activeTab = tabs.find(t => t.isActive);
    if (!activeTab) return { isDistraction: false };

    const activeCat = activeTab.domainCategory;
    const productiveCategories: DomainCategory[] = ['development', 'productivity', 'research'];
    const distractionCategories: DomainCategory[] = ['entertainment', 'social'];

    // If dominant work is productive but active tab is entertainment/social
    if (
      productiveCategories.includes(dominantCategory) &&
      distractionCategories.includes(activeCat)
    ) {
      return {
        isDistraction: true,
        reason: `You were focused on ${this.categoryLabel(dominantCategory)}, but switched to ${activeTab.domain} (${this.categoryLabel(activeCat)}).`,
      };
    }

    return { isDistraction: false };
  }

  private computeConfidence(tabs: SanitizedTab[], dominantCategory: DomainCategory): number {
    if (tabs.length === 0) return 0;

    const matchingTabs = tabs.filter(t => t.domainCategory === dominantCategory).length;
    const ratio = matchingTabs / tabs.length;

    // Confidence is based on coherence + number of tabs
    const base = Math.round(ratio * 80);
    const tabBonus = Math.min(20, tabs.length * 3);

    return Math.min(99, base + tabBonus) / 100;
  }

  private buildSummary(tabs: SanitizedTab[], durationMinutes: number, dominantCategory: DomainCategory): string {
    const activeTab = tabs.find(t => t.isActive);
    const catLabel = this.categoryLabel(dominantCategory);
    const domainCount = new Set(tabs.map(t => t.domain)).size;

    if (activeTab) {
      return `Working on ${catLabel} — currently viewing ${activeTab.domain}. ${domainCount} domains across ${tabs.length} tabs (${durationMinutes}m session).`;
    }

    return `${catLabel} session with ${tabs.length} tabs across ${domainCount} domains.`;
  }

  private suggestNextAction(
    tabs: SanitizedTab[],
    dominantCategory: DomainCategory,
    isDistracted: boolean
  ): string {
    if (isDistracted) {
      return 'Consider returning to your previous task.';
    }

    const activeTab = tabs.find(t => t.isActive);

    if (dominantCategory === 'development') {
      const hasGitHub = tabs.some(t => t.domain === 'github.com');
      const hasDocs = tabs.some(t => t.domainCategory === 'development' && t.title.toLowerCase().includes('doc'));
      const hasStackOverflow = tabs.some(t => t.domain === 'stackoverflow.com');

      if (hasStackOverflow && hasGitHub) {
        return 'Apply the solution from Stack Overflow to your codebase.';
      }
      if (hasDocs && hasGitHub) {
        return 'Implement the documented pattern in your project.';
      }
      if (hasGitHub) {
        return 'Continue coding or review your recent changes.';
      }
      return 'Focus on implementing the current feature.';
    }

    if (dominantCategory === 'research') {
      return 'Compile your findings into notes or documentation.';
    }

    if (dominantCategory === 'productivity') {
      return 'Complete the current document or task.';
    }

    if (activeTab) {
      return `Continue with: ${activeTab.title.substring(0, 40)}.`;
    }

    return 'Continue your current activity.';
  }

  private formatProjectName(raw: string): string {
    // Convert kebab-case or snake_case to Title Case
    return raw
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  private categoryLabel(cat: DomainCategory): string {
    const labels: Record<DomainCategory, string> = {
      development: 'Development',
      productivity: 'Productivity',
      communication: 'Communication',
      entertainment: 'Entertainment',
      research: 'Research',
      social: 'Social Media',
      general: 'General Browsing',
    };
    return labels[cat] || 'General Browsing';
  }

  private getTopDomains(tabs: SanitizedTab[], n: number): string[] {
    const domainTime = new Map<string, number>();
    for (const t of tabs) {
      domainTime.set(t.domain, (domainTime.get(t.domain) || 0) + t.timeSpentSeconds);
    }
    return [...domainTime.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([d]) => d);
  }
}
