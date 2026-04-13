export type TemplateId = "fast_cut" | "cinematic" | "subtitle_heavy" | "gameplay_focus";

export interface VideoAsset {
  id: string;
  uri: string;
  durationSec: number;
  createdAt: number;
}

export interface ProcessedClip {
  id: string;
  sourceAssetId: string;
  uri: string;
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface ProjectTemplate {
  id: TemplateId;
  name: string;
  textStyle: "minimal" | "bold" | "kinetic";
  motionStyle: "zoom" | "pan" | "shake";
  backgroundGameplay: "none" | "looped" | "dynamic";
  viralWeights: {
    pacing: number;
    hookDensity: number;
    readability: number;
  };
}

export interface ViralScoreInput {
  clipCount: number;
  averageClipDurationSec: number;
  hasVoiceOver: boolean;
  keywordMatchScore: number;
}

export interface SearchSuggestion {
  id: string;
  label: string;
}

export interface WordToken {
  word: string;
  startSec: number;
  endSec: number;
}

export interface CaptionTrack {
  mode: "word_by_word" | "fallback_subtitles";
  words: WordToken[];
  subtitleLines: string[];
}

export interface ProjectModel {
  id: string;
  name: string;
  createdAt: number;
  assets: VideoAsset[];
  processedClips: ProcessedClip[];
  selectedTemplateId?: TemplateId;
  voiceOverUri?: string;
  captions?: CaptionTrack;
}
