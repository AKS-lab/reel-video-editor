import { DebugLogger } from "../perf/DebugLogger";
import { FfmpegExecutor } from "../video/FfmpegExecutor";

export class IntegrationHealthService {
  static async checkAndroidPipeline(): Promise<{ ffmpegOk: boolean; message: string }> {
    const ffmpegOk = await FfmpegExecutor.isAvailable();
    if (!ffmpegOk) {
      const message = "FFmpeg health check failed.";
      DebugLogger.error("IntegrationHealth", message);
      return { ffmpegOk: false, message };
    }
    const message = "FFmpeg health check passed.";
    DebugLogger.info("IntegrationHealth", message);
    return { ffmpegOk: true, message };
  }
}
