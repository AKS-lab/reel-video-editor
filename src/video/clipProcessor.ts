/**
 * Clip validation and splitting rules (Module 2, 6).
 * Browser cannot decode all formats server-side; conversion/reject is signaled to UI.
 */

import { logInfo } from '../debug/debugLog';

export const MIN_CLIP_SEC = 10;
export const MAX_SINGLE_UPLOAD_SEC = 120;
export const SPLIT_MIN_SEC = 30;
export const SPLIT_MAX_SEC = 45;

export type ProcessResult =
  | { ok: true; segments: { start: number; end: number; duration: number }[]; gameplayTrimmed: boolean }
  | { ok: false; reason: 'too_short' | 'unsupported' | 'invalid_resolution'; detail?: string };

const SUPPORTED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

/** Minimum resolution (Module 6) — HD vertical friendly */
const MIN_W = 360;
const MIN_H = 640;

export function isMimeSupported(mime: string): boolean {
  return SUPPORTED_MIME.has(mime.split(';')[0].trim().toLowerCase());
}

/**
 * "Trim irrelevant gameplay" — heuristic placeholder: drop first/last 5% if duration > 60s.
 * Real implementation would use scene detection in native/ffmpeg pipeline.
 */
export function planSegments(durationSec: number): ProcessResult {
  if (durationSec < MIN_CLIP_SEC) {
    return { ok: false, reason: 'too_short', detail: `Clips under ${MIN_CLIP_SEC}s are discarded.` };
  }

  let d = durationSec;
  let trimStart = 0;
  let gameplayTrimmed = false;
  if (d > 60) {
    const margin = d * 0.05;
    trimStart = margin;
    d = d - 2 * margin;
    gameplayTrimmed = true;
  }

  if (d < MIN_CLIP_SEC) {
    return { ok: false, reason: 'too_short', detail: 'After trimming, clip is too short.' };
  }

  const segments: { start: number; end: number; duration: number }[] = [];

  if (d <= MAX_SINGLE_UPLOAD_SEC) {
    segments.push({ start: trimStart, end: trimStart + d, duration: d });
    return { ok: true, segments, gameplayTrimmed };
  }

  /** Split 30–45s chunks after removing slow sections (simulated: equal split within range). */
  let remaining = d;
  let cursor = trimStart;
  while (remaining > MIN_CLIP_SEC) {
    const chunk = Math.min(SPLIT_MAX_SEC, Math.max(SPLIT_MIN_SEC, Math.min(remaining, SPLIT_MAX_SEC)));
    if (remaining - chunk < MIN_CLIP_SEC && remaining <= SPLIT_MAX_SEC + MIN_CLIP_SEC) {
      segments.push({ start: cursor, end: cursor + remaining, duration: remaining });
      break;
    }
    segments.push({ start: cursor, end: cursor + chunk, duration: chunk });
    cursor += chunk;
    remaining -= chunk;
  }

  logInfo('clipProcessor.planSegments', { count: segments.length, gameplayTrimmed });
  return { ok: true, segments, gameplayTrimmed };
}

export function validateVideoResolution(width: number, height: number): boolean {
  return width >= MIN_W && height >= MIN_H;
}

export function rejectResolutionMessage(): string {
  return `Resolution must be at least ${MIN_W}×${MIN_H} for export.`;
}
