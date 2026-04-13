import RNFS from "react-native-fs";
import { DebugLogger } from "./DebugLogger";

const FOUR_GB_BYTES = 4 * 1024 * 1024 * 1024;
const SAFE_MAX_INPUT_BYTES = Math.floor(FOUR_GB_BYTES * 0.55);

export class MemoryOptimizer {
  static async guardInputFile(uri: string): Promise<void> {
    try {
      const stat = await RNFS.stat(uri.replace("file://", ""));
      const sizeBytes = Number(stat.size || 0);
      if (sizeBytes > SAFE_MAX_INPUT_BYTES) {
        throw new Error(
          `File too large for safe processing in current profile (${Math.round(sizeBytes / 1024 / 1024)}MB).`
        );
      }
      DebugLogger.info("MemoryOptimizer", `Input size OK: ${Math.round(sizeBytes / 1024 / 1024)}MB`);
    } catch (error) {
      DebugLogger.error("MemoryOptimizer", (error as Error).message);
      throw error;
    }
  }

  static async cleanupTempFiles(prefixes: string[]): Promise<void> {
    const dir = RNFS.CachesDirectoryPath;
    const files = await RNFS.readDir(dir);
    for (const file of files) {
      if (prefixes.some((prefix) => file.name.startsWith(prefix))) {
        try {
          await RNFS.unlink(file.path);
        } catch {
          // Ignore file not found or in-use race.
        }
      }
    }
    DebugLogger.info("MemoryOptimizer", `Temp cleanup complete for ${prefixes.join(", ")}`);
  }
}
