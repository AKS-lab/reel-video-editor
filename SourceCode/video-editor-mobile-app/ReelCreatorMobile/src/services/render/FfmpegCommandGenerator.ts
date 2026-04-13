import { CaptionTrack, ProcessedClip, ProjectTemplate } from "../../types";

function quote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function stripFilePrefix(uri: string): string {
  return uri.replace("file://", "");
}

function escapeSubtitlePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/:/g, "\\:");
}

export type TransitionType = "fade" | "wipeleft" | "slideright" | "dissolve";

export class FfmpegCommandGenerator {
  static trimLowActivity(inputUri: string, outputPath: string): string[] {
    const input = stripFilePrefix(inputUri);
    return [
      "-y",
      "-i",
      quote(input),
      "-vf",
      quote("select='gt(scene,0.012)',setpts=N/FRAME_RATE/TB"),
      "-af",
      quote("silenceremove=start_periods=1:start_threshold=-42dB:stop_periods=-1:stop_threshold=-42dB"),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      quote(outputPath)
    ];
  }

  static splitClip(inputUri: string, segmentSec: number, outputPatternPath: string): string[] {
    const input = stripFilePrefix(inputUri);
    return [
      "-y",
      "-i",
      quote(input),
      "-c",
      "copy",
      "-map",
      "0",
      "-f",
      "segment",
      "-segment_time",
      String(segmentSec),
      "-reset_timestamps",
      "1",
      quote(outputPatternPath)
    ];
  }

  static mergeConcat(concatListPath: string, outputPath: string): string[] {
    return [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      quote(concatListPath),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      quote(outputPath)
    ];
  }

  static exportWithTemplateAndAudio(params: {
    clips: ProcessedClip[];
    concatListPath: string;
    voiceOverUri: string;
    outputPath: string;
    captionsPath?: string;
    template: ProjectTemplate;
    transition: TransitionType;
  }): string[] {
    const voicePath = stripFilePrefix(params.voiceOverUri);
    const vfParts = [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      "fps=30"
    ];

    if (params.captionsPath) {
      vfParts.push(`subtitles=${escapeSubtitlePath(params.captionsPath)}`);
    }

    if (params.template.motionStyle === "shake") {
      vfParts.push("eq=contrast=1.06:saturation=1.1");
    } else if (params.template.motionStyle === "pan") {
      vfParts.push("eq=brightness=0.02:contrast=1.02");
    }

    return [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      quote(params.concatListPath),
      "-i",
      quote(voicePath),
      "-vf",
      quote(vfParts.join(",")),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-shortest",
      quote(params.outputPath)
    ];
  }

  static transitionFilter(type: TransitionType, durationSec: number, offsetSec: number): string {
    return `xfade=transition=${type}:duration=${durationSec}:offset=${offsetSec}`;
  }

  static mergeWithTransition(params: {
    inputAUri: string;
    inputBUri: string;
    outputPath: string;
    type: TransitionType;
    durationSec: number;
    offsetSec: number;
  }): string[] {
    const a = stripFilePrefix(params.inputAUri);
    const b = stripFilePrefix(params.inputBUri);
    const videoFilter = this.transitionFilter(params.type, params.durationSec, params.offsetSec);
    const audioFilter = `acrossfade=d=${params.durationSec}:c1=tri:c2=tri`;

    return [
      "-y",
      "-i",
      quote(a),
      "-i",
      quote(b),
      "-filter_complex",
      quote(`[0:v][1:v]${videoFilter}[v];[0:a][1:a]${audioFilter}[a]`),
      "-map",
      quote("[v]"),
      "-map",
      quote("[a]"),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      quote(params.outputPath)
    ];
  }
}
