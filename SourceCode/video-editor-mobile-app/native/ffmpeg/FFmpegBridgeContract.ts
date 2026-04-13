import { ExportPlan } from "../../../shared/core/ExportPlanBuilder";

export interface FFmpegExecutionResult {
  success: boolean;
  outputUri?: string;
  errorCode?: string;
  message?: string;
}

export interface FFmpegBridge {
  executeExportPlan(plan: ExportPlan): Promise<FFmpegExecutionResult>;
}

export interface BackgroundExecutionQueue {
  enqueue(jobId: string, action: () => Promise<FFmpegExecutionResult>): Promise<FFmpegExecutionResult>;
}
