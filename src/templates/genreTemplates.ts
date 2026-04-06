/**
 * Genre templates: text style, motion, energy, viral score (Module 3).
 * Automatic selection by genre + story length; user can override in editor state.
 */

export type GenreId = 'gaming' | 'satisfying' | 'story' | 'meme' | 'motivation';

export type TextStyle = 'bold-outline' | 'neon' | 'minimal';
export type MotionStyle = 'punch' | 'float' | 'glitch';

export interface GenreTemplate {
  id: string;
  genre: GenreId;
  name: string;
  textStyle: TextStyle;
  motionStyle: MotionStyle;
  energy: 1 | 2 | 3 | 4 | 5;
  viralScore: number;
  /** Background gameplay tag for preview assets */
  backgroundTag: string;
}

export const PRELOADED_TEMPLATES: GenreTemplate[] = [
  {
    id: 'gaming-hype',
    genre: 'gaming',
    name: 'Hype Clip',
    textStyle: 'bold-outline',
    motionStyle: 'punch',
    energy: 5,
    viralScore: 0.82,
    backgroundTag: 'gameplay-fast',
  },
  {
    id: 'satisfying-loop',
    genre: 'satisfying',
    name: 'Loop Calm',
    textStyle: 'minimal',
    motionStyle: 'float',
    energy: 2,
    viralScore: 0.76,
    backgroundTag: 'satisfying-loop',
  },
  {
    id: 'story-min',
    genre: 'story',
    name: 'Story Beat',
    textStyle: 'bold-outline',
    motionStyle: 'float',
    energy: 3,
    viralScore: 0.71,
    backgroundTag: 'story-soft',
  },
  {
    id: 'meme-chaos',
    genre: 'meme',
    name: 'Meme Chaos',
    textStyle: 'neon',
    motionStyle: 'glitch',
    energy: 5,
    viralScore: 0.88,
    backgroundTag: 'meme-fast',
  },
  {
    id: 'motivation-rise',
    genre: 'motivation',
    name: 'Rise',
    textStyle: 'bold-outline',
    motionStyle: 'punch',
    energy: 4,
    viralScore: 0.79,
    backgroundTag: 'motivation-glow',
  },
];

export function pickTemplateForStory(genre: GenreId, wordCount: number): GenreTemplate {
  const pool = PRELOADED_TEMPLATES.filter((t) => t.genre === genre);
  const base = pool[0] ?? PRELOADED_TEMPLATES[0];
  if (wordCount <= 8) return { ...base, motionStyle: 'punch' };
  if (wordCount <= 20) return { ...base, motionStyle: 'float' };
  return { ...base, motionStyle: 'glitch' };
}

/** Random transition variant within template style (Module 3). */
export function randomTransitionId(style: MotionStyle): string {
  const variants: Record<MotionStyle, string[]> = {
    punch: ['cut-zoom', 'shake-in', 'snap'],
    float: ['fade-slide', 'soft-blur', 'parallax'],
    glitch: ['rgb-split', 'digital-tear', 'noise-wipe'],
  };
  const list = variants[style];
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Auto-fix misaligned animation metadata (Module 6) — clamp and normalize. */
export function fixAnimationTiming(startMs: number, endMs: number, durationMs: number): { start: number; end: number } {
  const s = Math.max(0, Math.min(startMs, durationMs));
  const e = Math.max(s, Math.min(endMs, durationMs));
  return { start: s, end: e };
}
