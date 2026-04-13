import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { DebugLogger } from "../perf/DebugLogger";

const CACHE_INDEX_KEY = "reel_cache_index_v1";
const MAX_CACHE_BYTES = 2 * 1024 * 1024 * 1024;
const SOFT_LIMIT_BYTES = Math.floor(MAX_CACHE_BYTES * 0.9);

type CacheEntry = {
  uri: string;
  sizeBytes: number;
  lastAccessTs: number;
};

export class LruStorageManager {
  static async touch(uri: string): Promise<void> {
    const index = await this.getIndex();
    const existing = index[uri];

    if (!existing) {
      let sizeBytes = 0;
      try {
        const stat = await RNFS.stat(uri.replace("file://", ""));
        sizeBytes = Number(stat.size || 0);
      } catch {
        sizeBytes = 0;
      }
      index[uri] = { uri, sizeBytes, lastAccessTs: Date.now() };
    } else {
      existing.lastAccessTs = Date.now();
    }

    await this.setIndex(index);
    await this.enforceLimit();
  }

  static async enforceLimit(): Promise<void> {
    const index = await this.getIndex();
    const entries = await this.sweepMissingFiles(Object.values(index), index);
    const total = entries.reduce((sum, item) => sum + item.sizeBytes, 0);
    if (total <= SOFT_LIMIT_BYTES) return;

    const sorted = entries.sort((a, b) => a.lastAccessTs - b.lastAccessTs);
    let current = total;
    let deleted = 0;
    for (const candidate of sorted) {
      if (current <= SOFT_LIMIT_BYTES) break;
      try {
        await RNFS.unlink(candidate.uri.replace("file://", ""));
      } catch {
        // Ignore missing files to keep cleanup robust.
      }
      delete index[candidate.uri];
      current -= candidate.sizeBytes;
      deleted += 1;
    }
    await this.setIndex(index);
    if (deleted > 0) {
      DebugLogger.warn(
        "LruStorageManager",
        `Evicted ${deleted} cached items. Usage ${Math.round(current / 1024 / 1024)}MB.`
      );
    }
  }

  private static async sweepMissingFiles(
    entries: CacheEntry[],
    index: Record<string, CacheEntry>
  ): Promise<CacheEntry[]> {
    const kept: CacheEntry[] = [];
    for (const entry of entries) {
      try {
        const exists = await RNFS.exists(entry.uri.replace("file://", ""));
        if (!exists) {
          delete index[entry.uri];
          continue;
        }
        kept.push(entry);
      } catch {
        delete index[entry.uri];
      }
    }
    return kept;
  }

  private static async getIndex(): Promise<Record<string, CacheEntry>> {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, CacheEntry>;
    } catch {
      return {};
    }
  }

  private static async setIndex(index: Record<string, CacheEntry>): Promise<void> {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  }
}
