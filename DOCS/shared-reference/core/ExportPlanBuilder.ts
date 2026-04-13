import { ExportRequest, TimelineClip } from "../contracts/ProjectSchema";
import { TimelinePlan } from "./TimelinePlanner";

export interface ExportClipInput {
  clipId: string;
  inputUri: string;
  startSec: number;
  endSec: number;
}

export interface FFmpegCommandPlan {
  commandArgs: string[];
  expectedOutputUri: string;
}

export interface ExportPlan {
  projectId: string;
  clips: ExportClipInput[];
  outputUri: string;
  ffmpegPlan: FFmpegCommandPlan;
}

function toExportClipInputs(clips: TimelineClip[]): ExportClipInput[] {
  return clips.map((clip) => ({
    clipId: clip.clipId,
    inputUri: clip.sourceUri,
    startSec: clip.range.startSec,
    endSec: clip.range.endSec
  }));
}

export function buildExportPlan(timelinePlan: TimelinePlan, request: ExportRequest): ExportPlan {
  const outputUri = `exports/${request.projectId}/${request.outputName}.${request.profile.format}`;
  const clips = toExportClipInputs(timelinePlan.clips);

  const ffmpegPlan: FFmpegCommandPlan = {
    commandArgs: [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "<concat_list_path>",
      "-vf",
      `scale=${request.profile.width}:${request.profile.height},fps=${request.profile.fps}`,
      "-b:v",
      `${request.profile.videoBitrateKbps}k`,
      "-b:a",
      `${request.profile.audioBitrateKbps}k`,
      outputUri
    ],
    expectedOutputUri: outputUri
  };

  return {
    projectId: request.projectId,
    clips,
    outputUri,
    ffmpegPlan
  };
}
