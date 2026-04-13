import { CacheMetadata } from "../contracts/ProjectSchema";

export const CACHE_HARD_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
export const CACHE_SOFT_LIMIT_BYTES = Math.floor(1.8 * 1024 * 1024 * 1024);

export interface EvictionDecision {
  evictKeys: string[];
  bytesToFree: number;
}

export function chooseEvictions(records: CacheMetadata[], currentUsageBytes: number): EvictionDecision {
  if (currentUsageBytes <= CACHE_SOFT_LIMIT_BYTES) {
    return { evictKeys: [], bytesToFree: 0 };
  }

  const requiredBytes = currentUsageBytes - CACHE_SOFT_LIMIT_BYTES;
  const candidates = records
    .filter((r) => !r.pinned)
    .sort((a, b) => {
      if (a.lastAccessTs !== b.lastAccessTs) return a.lastAccessTs - b.lastAccessTs;
      return a.recomputeCostHint - b.recomputeCostHint;
    });

  const evictKeys: string[] = [];
  let freedBytes = 0;

  for (const item of candidates) {
    if (freedBytes >= requiredBytes) break;
    evictKeys.push(item.key);
    freedBytes += item.sizeBytes;
  }

  return {
    evictKeys,
    bytesToFree: Math.max(0, requiredBytes - freedBytes)
  };
}
