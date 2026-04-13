import AsyncStorage from "@react-native-async-storage/async-storage";
import { DebugLogger } from "../perf/DebugLogger";
import { RenderEngineError } from "./RenderErrors";

type JobStatus = "queued" | "running" | "completed" | "failed";
type JobKind = "trim" | "split" | "merge" | "render";

export type QueueJob = {
  id: string;
  kind: JobKind;
  args: string[];
  createdAt: number;
  status: JobStatus;
  attempts: number;
  maxRetries: number;
  lastRunAt?: number;
  error?: string;
};

type QueueExecutor = (args: string[]) => Promise<void>;

const STORAGE_KEY = "ffmpeg_processing_queue_v1";
const MAX_PERSISTED_JOBS = 300;

export class ProcessingQueue {
  private static jobs: QueueJob[] = [];
  private static loaded = false;
  private static runningCount = 0;
  private static maxConcurrent = 2;
  private static executor: QueueExecutor | null = null;
  private static waiters: Record<string, { resolve: () => void; reject: (e: Error) => void }> = {};

  static async configure(executor: QueueExecutor, maxConcurrent = 2): Promise<void> {
    this.executor = executor;
    this.maxConcurrent = Math.max(1, maxConcurrent);
    if (!this.loaded) {
      await this.load();
      this.loaded = true;
    }
    // Recover unfinished jobs across app restarts.
    for (const job of this.jobs) {
      if (job.status === "running") {
        job.status = "queued";
        DebugLogger.warn("ProcessingQueue", `Recovered running job ${job.id} to queued state.`);
      }
    }
    await this.persist();
    void this.pump();
  }

  static async enqueue(kind: JobKind, args: string[]): Promise<void> {
    if (!this.executor) {
      throw new RenderEngineError("QUEUE_FAILURE", "ProcessingQueue is not configured.");
    }

    const id = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const job: QueueJob = {
      id,
      kind,
      args,
      createdAt: Date.now(),
      status: "queued",
      attempts: 0,
      maxRetries: 3
    };

    this.jobs.push(job);
    await this.persist();

    const promise = new Promise<void>((resolve, reject) => {
      this.waiters[id] = { resolve, reject };
    });

    DebugLogger.info("ProcessingQueue", `Enqueued ${kind} job ${id}.`);
    void this.pump();
    return promise;
  }

  static getJobs(): QueueJob[] {
    return [...this.jobs];
  }

  private static async pump(): Promise<void> {
    if (!this.executor) return;
    while (this.runningCount < this.maxConcurrent) {
      const next = this.jobs.find((job) => job.status === "queued");
      if (!next) break;
      this.runningCount += 1;
      void this.runJob(next);
    }
  }

  private static async runJob(job: QueueJob): Promise<void> {
    if (!this.executor) return;
    job.status = "running";
    job.attempts += 1;
    job.lastRunAt = Date.now();
    await this.persist();
    DebugLogger.info("ProcessingQueue", `Running ${job.kind} job ${job.id} (attempt ${job.attempts}/${job.maxRetries}).`);

    try {
      await this.executor(job.args);
      job.status = "completed";
      job.error = undefined;
      await this.persist();
      this.waiters[job.id]?.resolve();
      delete this.waiters[job.id];
      DebugLogger.info("ProcessingQueue", `Completed job ${job.id}.`);
    } catch (error) {
      job.error = (error as Error).message;
      if (job.attempts < job.maxRetries) {
        job.status = "queued";
        await this.persist();
        DebugLogger.warn("ProcessingQueue", `Retrying job ${job.id} after failure.`);
      } else {
        job.status = "failed";
        await this.persist();
        this.waiters[job.id]?.reject(
          new RenderEngineError("FFMPEG_FAILURE", `Queue job failed (${job.kind}) after ${job.maxRetries} attempts.`, job.error)
        );
        delete this.waiters[job.id];
        DebugLogger.error("ProcessingQueue", `Job ${job.id} failed permanently.`);
      }
    } finally {
      this.runningCount = Math.max(0, this.runningCount - 1);
      void this.pump();
    }
  }

  private static async load(): Promise<void> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.jobs = [];
      return;
    }
    try {
      this.jobs = JSON.parse(raw) as QueueJob[];
    } catch {
      this.jobs = [];
    }
  }

  private static async persist(): Promise<void> {
    this.pruneFinishedJobs();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.jobs));
  }

  private static pruneFinishedJobs(): void {
    const active = this.jobs.filter((j) => j.status === "queued" || j.status === "running");
    const finished = this.jobs
      .filter((j) => j.status === "completed" || j.status === "failed")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.max(0, MAX_PERSISTED_JOBS - active.length));

    this.jobs = [...active, ...finished].sort((a, b) => a.createdAt - b.createdAt);
  }
}
