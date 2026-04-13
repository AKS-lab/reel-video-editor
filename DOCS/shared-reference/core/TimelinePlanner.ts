import { assertValidProject, ProjectModel, TimelineClip } from "../contracts/ProjectSchema";

export interface TimelinePlan {
  projectId: string;
  totalDurationSec: number;
  clips: TimelineClip[];
}

export function buildTimelinePlan(project: ProjectModel): TimelinePlan {
  assertValidProject(project);

  let cursorSec = 0;
  const clips: TimelineClip[] = project.clips.map((clip, index) => {
    const startSec = cursorSec;
    const endSec = startSec + clip.durationSec;
    cursorSec = endSec;

    return {
      clipId: clip.clipId,
      sourceUri: clip.uri,
      range: { startSec: 0, endSec: clip.durationSec },
      timelineStartSec: startSec,
      timelineEndSec: endSec,
      transitionOut: index === project.clips.length - 1 ? "none" : "cut"
    };
  });

  return {
    projectId: project.projectId,
    totalDurationSec: cursorSec,
    clips
  };
}
