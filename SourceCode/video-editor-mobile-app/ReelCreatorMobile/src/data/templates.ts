import { ProjectTemplate } from "../types";

export const TEMPLATE_LIBRARY: ProjectTemplate[] = [
  {
    id: "fast_cut",
    name: "Fast Cut Story",
    textStyle: "bold",
    motionStyle: "shake",
    backgroundGameplay: "dynamic",
    viralWeights: { pacing: 0.5, hookDensity: 0.35, readability: 0.15 }
  },
  {
    id: "cinematic",
    name: "Cinematic Flow",
    textStyle: "minimal",
    motionStyle: "pan",
    backgroundGameplay: "looped",
    viralWeights: { pacing: 0.25, hookDensity: 0.2, readability: 0.55 }
  },
  {
    id: "subtitle_heavy",
    name: "Caption Heavy",
    textStyle: "kinetic",
    motionStyle: "zoom",
    backgroundGameplay: "none",
    viralWeights: { pacing: 0.2, hookDensity: 0.25, readability: 0.55 }
  },
  {
    id: "gameplay_focus",
    name: "Gameplay Focus",
    textStyle: "bold",
    motionStyle: "zoom",
    backgroundGameplay: "dynamic",
    viralWeights: { pacing: 0.55, hookDensity: 0.35, readability: 0.1 }
  }
];

export const TEMPLATE_SUGGESTIONS = [
  "fast",
  "cinematic",
  "captions",
  "gaming",
  "youtube shorts",
  "instagram reels"
];
