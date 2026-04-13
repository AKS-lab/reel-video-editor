import { DebugLogger } from "../perf/DebugLogger";
import { getFfmpegRuntime } from "./FfmpegRuntime";

export class FfmpegExecutor {
  static async run(args: string[]): Promise<void> {
    const runtime = getFfmpegRuntime();
    if (!runtime) {
      throw new Error("ffmpeg-kit-react-native is not installed/configured.");
    }
    const { FFmpegKit, ReturnCode } = runtime;
    const command = args.join(" ");
    DebugLogger.info("FfmpegExecutor", `Run: ${command.slice(0, 200)}`);
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (!ReturnCode.isSuccess(returnCode)) {
      const logs = await session.getAllLogsAsString();
      DebugLogger.error("FfmpegExecutor", `Failure: ${logs?.slice(0, 300) ?? "unknown"}`);
      throw new Error(`FFmpeg command failed: ${command}\n${logs ?? ""}`);
    }
  }

  static async runInBackground(args: string[]): Promise<void> {
    const runtime = getFfmpegRuntime();
    if (!runtime) {
      throw new Error("ffmpeg-kit-react-native is not installed/configured.");
    }
    const { FFmpegKit, ReturnCode } = runtime;
    const command = args.join(" ");
    DebugLogger.info("FfmpegExecutor", `Run background: ${command.slice(0, 200)}`);
    await new Promise<void>((resolve, reject) => {
      void FFmpegKit.executeAsync(command, async (session) => {
        const returnCode = await session.getReturnCode();
        if (ReturnCode.isSuccess(returnCode)) {
          DebugLogger.info("FfmpegExecutor", "Background command completed.");
          resolve();
          return;
        }
        const logs = await session.getAllLogsAsString();
        DebugLogger.error("FfmpegExecutor", `Background failure: ${logs?.slice(0, 300) ?? "unknown"}`);
        reject(new Error(`Background FFmpeg failed: ${command}\n${logs ?? ""}`));
      });
    });
  }

  static async getDurationSec(uri: string): Promise<number> {
    const runtime = getFfmpegRuntime();
    if (!runtime) {
      throw new Error("ffmpeg-kit-react-native is not installed/configured.");
    }
    const { FFprobeKit } = runtime;
    const session = await FFprobeKit.getMediaInformation(uri);
    const info = await session.getMediaInformation();
    const durationRaw = info?.getDuration();
    const parsed = Number(durationRaw ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  static async isAvailable(): Promise<boolean> {
    if (!getFfmpegRuntime()) {
      return false;
    }
    try {
      await this.run(["-version"]);
      return true;
    } catch {
      return false;
    }
  }
}
