/** Recent projects + recently used templates (Module 1). */

import { LRUCache } from '../cache/lruCache';

export type ProjectSummary = {
  id: string;
  title: string;
  updatedAt: number;
  thumbDataUrl?: string;
};

const recentProjects: ProjectSummary[] = [];
const recentTemplateIds = new LRUCache<string, true>(12);

/** Seed demo data for UI */
export function seedDemoProjects(): void {
  if (recentProjects.length > 0) return;
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    recentProjects.push({
      id: `p-${i}`,
      title: `Project ${i + 1}`,
      updatedAt: now - i * 3600000,
    });
  }
}

export function getRecentProjectsPage(offset: number, limit: number): ProjectSummary[] {
  return recentProjects.slice(offset, offset + limit);
}

export function getRecentProjectCount(): number {
  return recentProjects.length;
}

export function touchTemplate(templateId: string): void {
  recentTemplateIds.set(templateId, true);
}

export function getRecentTemplateIds(): string[] {
  return recentTemplateIds.keys().slice().reverse();
}
