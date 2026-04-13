export type ProjectId = string;
export type ClipId = string;
export type ArtifactId = string;

export type TransitionType = "cut" | "fade" | "none";

export interface TimeRangeSec {
  startSec: number;
  endSec: number;
}

export interface ClipSource {
  clipId: ClipId;
  uri: string;
  durationSec: number;
  fps?: number;
  width?: number;
  height?: number;
}

export interface TimelineClip {
  clipId: ClipId;
  sourceUri: string;
  range: TimeRangeSec;
  timelineStartSec: number;
  timelineEndSec: number;
  transitionOut: TransitionType;
}

export interface ProjectModel {
  projectId: ProjectId;
  title: string;
  createdAtMs: number;
  updatedAtMs: number;
  clips: ClipSource[];
}

export interface ExportProfile {
  width: number;
  height: number;
  fps: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  format: "mp4";
}

export interface ExportRequest {
  projectId: ProjectId;
  outputName: string;
  profile: ExportProfile;
}

export interface CacheMetadata {
  artifactId: ArtifactId;
  key: string;
  sizeBytes: number;
  lastAccessTs: number;
  pinned: boolean;
  recomputeCostHint: number;
  artifactType: "proxy" | "thumbnail" | "waveform" | "segment" | "export";
}

export function assertValidProject(project: ProjectModel): void {
  if (!project.projectId) throw new Error("projectId is required");
  if (!project.title) throw new Error("title is required");
  if (!Array.isArray(project.clips) || project.clips.length === 0) {
    throw new Error("at least one clip is required");
  }

  for (const clip of project.clips) {
    if (!clip.clipId) throw new Error("clipId is required");
    if (!clip.uri) throw new Error("clip uri is required");
    if (!Number.isFinite(clip.durationSec) || clip.durationSec <= 0) {
      throw new Error("clip durationSec must be > 0");
    }
  }
}
