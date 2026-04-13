/**
 * Web runtime orchestration boundary.
 * This module remains framework-free (Vanilla JS).
 */
import { buildTimelinePlan } from "../../shared/core/TimelinePlanner";
import { buildExportPlan } from "../../shared/core/ExportPlanBuilder";

export function createWebRuntimePlan(project, exportRequest) {
  const timelinePlan = buildTimelinePlan(project);
  const exportPlan = buildExportPlan(timelinePlan, exportRequest);
  return {
    timelineDurationSec: timelinePlan.totalDurationSec,
    exportPlan
  };
}
