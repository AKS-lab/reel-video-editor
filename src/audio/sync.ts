/**
 * Word-by-word VO ↔ caption sync with subtitles fallback (Module 4, 5).
 */

export type WordCue = { word: string; start: number; end: number };

export type SyncResult =
  | { mode: 'word_sync'; cues: WordCue[] }
  | { mode: 'subtitles_fallback'; message: string; cues: WordCue[] };

/** Placeholder: real app uses Web Audio + alignment or server ASR. */
export function buildSyncFromVoiceAndCaption(
  captionWords: string[],
  voiceDurationSec: number,
  alignmentConfidence: number
): SyncResult {
  if (captionWords.length === 0) {
    return {
      mode: 'subtitles_fallback',
      message: 'No caption words; subtitles only.',
      cues: [],
    };
  }

  if (alignmentConfidence < 0.35) {
    const cues: WordCue[] = captionWords.map((word, i) => {
      const slice = voiceDurationSec / captionWords.length;
      return { word, start: i * slice, end: (i + 1) * slice };
    });
    return {
      mode: 'subtitles_fallback',
      message: 'Could not align voice to words reliably. Using timed subtitles.',
      cues,
    };
  }

  const slice = voiceDurationSec / captionWords.length;
  const cues: WordCue[] = captionWords.map((word, i) => ({
    word,
    start: i * slice,
    end: (i + 1) * slice,
  }));
  return { mode: 'word_sync', cues };
}

/** Loop captions if VO loops (Module 7 note). */
export function loopCuesToDuration(cues: WordCue[], totalSec: number, voiceDurationSec: number): WordCue[] {
  if (voiceDurationSec <= 0 || totalSec <= voiceDurationSec) return cues;
  const out: WordCue[] = [];
  let t = 0;
  while (t < totalSec) {
    for (const c of cues) {
      out.push({
        word: c.word,
        start: t + c.start,
        end: t + c.end,
      });
    }
    t += voiceDurationSec;
  }
  return out.map((c) => ({
    ...c,
    end: Math.min(c.end, totalSec),
  }));
}
