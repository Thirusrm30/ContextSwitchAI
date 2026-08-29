/**
 * ContextSwitch — Backend API Client
 * Connects frontend & extension to the Express / MongoDB backend.
 * Provides fallback to local storage if the backend is offline/unreachable.
 */

import { WorkSession, ProjectHistory, AIContextResult, AIAnalysisInput, AISummaryInput } from '../types/context';

const DEFAULT_API_BASE = 'http://localhost:5000/api';

class ApiClient {
  private baseUrl: string = DEFAULT_API_BASE;
  private isServerHealthy: boolean | null = null;
  private lastHealthCheck: number = 0;

  constructor() {
    this.checkHealth();
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (this.isServerHealthy !== null && now - this.lastHealthCheck < 10000) {
      return this.isServerHealthy;
    }
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      this.isServerHealthy = res.ok;
    } catch {
      this.isServerHealthy = false;
    }
    this.lastHealthCheck = now;
    return this.isServerHealthy;
  }

  async getDeviceId(): Promise<string> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const stored = await chrome.storage.local.get('cs_device_id');
      if (stored.cs_device_id) return stored.cs_device_id;
      const newId = 'dev_' + Math.random().toString(36).substring(2, 12);
      await chrome.storage.local.set({ cs_device_id: newId });
      return newId;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      let id = localStorage.getItem('cs_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('cs_device_id', id);
      }
      return id;
    }
    return 'dev_default';
  }

  // --- SESSIONS ---
  async getSessions(limit = 20): Promise<WorkSession[]> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return [];
      const deviceId = await this.getDeviceId();
      const res = await fetch(`${this.baseUrl}/sessions?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.sessions || []).map(this.mapDbSessionToWorkSession);
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch sessions:', err);
      return [];
    }
  }

  async saveSession(session: Partial<WorkSession>): Promise<WorkSession | null> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return null;
      const deviceId = await this.getDeviceId();
      const payload = {
        deviceId,
        projectName: session.projectName || 'General Work',
        task: session.currentTask || '',
        contextScore: session.contextScore || 0,
        startedAt: session.startedAt || new Date().toISOString(),
        endedAt: session.lastActiveAt ? new Date().toISOString() : null,
        durationMinutes: session.durationMinutes || 0,
        tabs: (session.openTabs || []).map(t => ({
          url: t.url,
          title: t.title,
          favicon: t.favicon || '',
          domain: t.domain,
          category: t.domainCategory || t.category || 'general',
          timeSpentSeconds: t.timeSpentSeconds || 0
        })),
        summary: session.summary || '',
        suggestedNextStep: session.suggestedNextStep || '',
        unfinishedWork: session.unfinishedWork || '',
        tags: session.tags || [],
        switchCount: session.switchCount || 0,
        timeline: session.timeline || []
      };

      const res = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000)
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const saved = await res.json();
      return this.mapDbSessionToWorkSession(saved);
    } catch (err) {
      console.warn('[ApiClient] Failed to save session to DB:', err);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return false;
      const res = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch (err) {
      console.warn('[ApiClient] Failed to delete session:', err);
      return false;
    }
  }

  // --- PROJECTS ---
  async getProjects(): Promise<ProjectHistory[]> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return [];
      const deviceId = await this.getDeviceId();
      const res = await fetch(`${this.baseUrl}/projects?deviceId=${encodeURIComponent(deviceId)}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return [];
      const projects = await res.json();
      return (projects || []).map((p: any) => ({
        id: p._id || p.id,
        projectName: p.name,
        lastActiveAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recently',
        sessionCount: p.sessionCount || 1,
        currentTask: p.currentTask || p.description || '',
        totalTabsOpened: p.totalTabsOpened || 0,
        averageContextScore: p.averageContextScore || 80,
        tags: p.tags || [],
        sessions: []
      }));
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch projects:', err);
      return [];
    }
  }

  // --- AI PROXY ---
  async analyzeContextAI(input: AIAnalysisInput): Promise<AIContextResult | null> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return null;
      const res = await fetch(`${this.baseUrl}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] AI Analysis Proxy error:', err);
      return null;
    }
  }

  async generateSummaryAI(input: AISummaryInput): Promise<string | null> {
    try {
      const healthy = await this.checkHealth();
      if (!healthy) return null;
      const res = await fetch(`${this.baseUrl}/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.summary || null;
    } catch (err) {
      console.warn('[ApiClient] AI Summary Proxy error:', err);
      return null;
    }
  }

  private mapDbSessionToWorkSession(doc: any): WorkSession {
    return {
      id: doc._id || doc.id || `sess-${Date.now()}`,
      projectName: doc.projectName || 'General Browsing',
      currentTask: doc.task || 'Browsing',
      contextScore: doc.contextScore || 0,
      startedAt: doc.startedAt || doc.createdAt || new Date().toISOString(),
      lastActiveAt: doc.endedAt ? 'Ended' : 'Just now',
      durationMinutes: doc.durationMinutes || 0,
      openTabs: (doc.tabs || []).map((t: any, idx: number) => ({
        id: t._id || `t-${idx}`,
        title: t.title || 'Untitled',
        url: t.url,
        domain: t.domain || (t.url ? new URL(t.url).hostname : ''),
        domainCategory: t.category || 'general',
        category: t.category || 'general',
        favicon: t.favicon || '',
        timeSpentSeconds: t.timeSpentSeconds || 0
      })),
      summary: doc.summary || 'Session recorded.',
      tags: doc.tags || [],
      switchCount: doc.switchCount || 0,
      isCurrent: false,
      suggestedNextStep: doc.suggestedNextStep || '',
      unfinishedWork: doc.unfinishedWork || '',
      timeline: doc.timeline || []
    };
  }
}

export const apiClient = new ApiClient();
