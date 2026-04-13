import { CaptionTrack, WordToken } from "../../types";

export class CaptionSyncService {
  static createWordByWordSync(transcript: string, durationSec: number): CaptionTrack {
    const words = transcript
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const tokenDuration = words.length ? durationSec / words.length : durationSec;

    const synced: WordToken[] = words.map((word, idx) => {
      const startSec = Number((idx * tokenDuration).toFixed(2));
      const endSec = Number(((idx + 1) * tokenDuration).toFixed(2));
      return { word, startSec, endSec };
    });

    return {
      mode: "word_by_word",
      words: synced,
      subtitleLines: []
    };
  }

  static createFallbackSubtitles(transcript: string): CaptionTrack {
    const lines = transcript
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      mode: "fallback_subtitles",
      words: [],
      subtitleLines: lines.length ? lines : [transcript]
    };
  }

  static toSrt(track: CaptionTrack): string {
    if (track.mode === "word_by_word") {
      return track.words
        .map((token, idx) => {
          return `${idx + 1}\n${toSrtTime(token.startSec)} --> ${toSrtTime(token.endSec)}\n${token.word}\n`;
        })
        .join("\n");
    }

    return track.subtitleLines
      .map((line, idx) => {
        const startSec = idx * 2.4;
        const endSec = startSec + 2.2;
        return `${idx + 1}\n${toSrtTime(startSec)} --> ${toSrtTime(endSec)}\n${line}\n`;
      })
      .join("\n");
  }
}

function toSrtTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hh = Math.floor(totalMs / 3600000);
  const mm = Math.floor((totalMs % 3600000) / 60000);
  const ss = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const pad = (v: number, len = 2) => String(v).padStart(len, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)},${pad(ms, 3)}`;
}
