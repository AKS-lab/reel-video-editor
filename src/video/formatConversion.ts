/**
 * Unsupported formats: convert or reject (Module 6).
 * Browser path: try decode via video element; if error, reject or suggest re-export as MP4.
 */

import { logWarn } from '../debug/debugLog';

export type ConvertResult =
  | { ok: true; mime: string; note?: string }
  | { ok: false; reason: string };

const PREFERRED = 'video/mp4';

export function adviseConversion(file: File): ConvertResult {
  const mime = file.type.split(';')[0].toLowerCase();
  if (mime === PREFERRED || mime === 'video/webm') {
    return { ok: true, mime };
  }
  if (mime === '' || mime === 'application/octet-stream') {
    logWarn('Unknown container; user should re-export as MP4', { name: file.name });
    return { ok: false, reason: 'Unknown format. Please export as MP4 or WebM and retry.' };
  }
  return {
    ok: true,
    mime,
    note: 'Will attempt decode in-browser; if playback fails, convert to MP4 offline.',
  };
}
