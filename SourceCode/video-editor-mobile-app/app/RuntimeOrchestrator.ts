import { ProjectModel, ExportRequest } from "../../shared/contracts/ProjectSchema";
import { buildTimelinePlan } from "../../shared/core/TimelinePlanner";
import { buildExportPlan, ExportPlan } from "../../shared/core/ExportPlanBuilder";

export interface MobileRuntimeResult {
  timelineDurationSec: number;
  exportPlan: ExportPlan;
}

export function createMobileRuntimePlan(
  project: ProjectModel,
  exportRequest: ExportRequest
): MobileRuntimeResult {
  const timelinePlan = buildTimelinePlan(project);
  const exportPlan = buildExportPlan(timelinePlan, exportRequest);

  return {
    timelineDurationSec: timelinePlan.totalDurationSec,
    exportPlan
  };
}
