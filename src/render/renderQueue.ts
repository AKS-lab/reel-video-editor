/**
 * Background render queue with parallel slots based on RAM hint (Module 7).
 */

import { logError, logInfo } from '../debug/debugLog';

export type RenderJob = {
  id: string;
  label: string;
  /** low | full */
  quality: 'preview_low' | 'full';
  run: () => Promise<void>;
};

const DEFAULT_PARALLEL = () => {
  const ram = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof ram === 'number' && ram >= 8) return 3;
  if (typeof ram === 'number' && ram >= 4) return 2;
  return 1;
};

export class RenderQueue {
  private readonly maxParallel: number;
  private active = 0;
  private queue: RenderJob[] = [];

  constructor(maxParallel?: number) {
    this.maxParallel = maxParallel ?? DEFAULT_PARALLEL();
  }

  enqueue(job: RenderJob): void {
    this.queue.push(job);
    logInfo('RenderQueue enqueue', { id: job.id, pending: this.queue.length });
    this.pump();
  }

  private pump(): void {
    while (this.active < this.maxParallel && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.active += 1;
      job
        .run()
        .catch((e) => logError(`Render job failed: ${job.id}`, e))
        .finally(() => {
          this.active -= 1;
          this.pump();
        });
    }
  }
}

export const globalRenderQueue = new RenderQueue();
