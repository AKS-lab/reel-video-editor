import RNFS from "react-native-fs";
import { ProcessedClip } from "../../types";
import { FfmpegExecutor } from "./FfmpegExecutor";

export class PreviewService {
  static async buildLowResPreview(clips: ProcessedClip[]): Promise<string> {
    if (!clips.length) throw new Error("No processed clips available.");
    const source = clips[0].uri;
    const out = `${RNFS.CachesDirectoryPath}/preview_low_res.mp4`;
    await FfmpegExecutor.run([
      "-y",
      "-i",
      source,
      "-vf",
      "scale=360:640",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "30",
      "-an",
      out
    ]);
    return `file://${out}`;
  }

  static async buildFullPreview(clips: ProcessedClip[]): Promise<string> {
    if (!clips.length) throw new Error("No processed clips available.");
    return clips[0].uri;
  }
}
