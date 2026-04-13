import { TEMPLATE_LIBRARY, TEMPLATE_SUGGESTIONS } from "../../data/templates";
import { ProjectModel, ProjectTemplate, SearchSuggestion, ViralScoreInput } from "../../types";

export class TemplateEngineService {
  static getSuggestions(query: string): SearchSuggestion[] {
    if (!query.trim()) {
      return TEMPLATE_SUGGESTIONS.slice(0, 5).map((label, idx) => ({ id: `${idx}`, label }));
    }
    const normalized = query.toLowerCase();
    return TEMPLATE_SUGGESTIONS.filter((item) => item.includes(normalized))
      .slice(0, 5)
      .map((label, idx) => ({ id: `${idx}`, label }));
  }

  static computeViralScore(template: ProjectTemplate, input: ViralScoreInput): number {
    const pacingScore = Math.min(1, input.clipCount / 12) * template.viralWeights.pacing;
    const hookScore = Math.min(1, 30 / Math.max(1, input.averageClipDurationSec)) * template.viralWeights.hookDensity;
    const readScore =
      (input.hasVoiceOver ? 1 : 0.5) * template.viralWeights.readability +
      input.keywordMatchScore * 0.1;
    return Number((pacingScore + hookScore + readScore).toFixed(3));
  }

  static autoSelectTemplate(project: ProjectModel, query: string): ProjectTemplate {
    const averageDuration =
      project.processedClips.length === 0
        ? 0
        : project.processedClips.reduce((sum, c) => sum + c.durationSec, 0) / project.processedClips.length;
    const keywordMatchScore = query.length > 2 ? 1 : 0.6;

    const scoreInput: ViralScoreInput = {
      clipCount: project.processedClips.length,
      averageClipDurationSec: averageDuration,
      hasVoiceOver: Boolean(project.voiceOverUri),
      keywordMatchScore
    };

    return TEMPLATE_LIBRARY.reduce((best, current) => {
      const bestScore = this.computeViralScore(best, scoreInput);
      const currentScore = this.computeViralScore(current, scoreInput);
      return currentScore > bestScore ? current : best;
    }, TEMPLATE_LIBRARY[0]);
  }

  static getAll(): ProjectTemplate[] {
    return TEMPLATE_LIBRARY;
  }
}
