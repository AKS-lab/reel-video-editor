import RNFS from "react-native-fs";
import { CaptionTrack, ProcessedClip, ProjectModel, ProjectTemplate, VideoAsset } from "../../types";
import { CaptionSyncService } from "../audio/CaptionSyncService";
import { DebugLogger } from "../perf/DebugLogger";
import { MemoryOptimizer } from "../perf/MemoryOptimizer";
import { LruStorageManager } from "../storage/LruStorageManager";
import { TemplateEngineService } from "../template/TemplateEngineService";
import { FfmpegExecutor } from "../video/FfmpegExecutor";
import { FfmpegCommandGenerator, TransitionType } from "./FfmpegCommandGenerator";
import { ProcessingQueue } from "./ProcessingQueue";
import { RenderEngineError } from "./RenderErrors";

const MIN_CLIP_SEC = 10;
const SPLIT_THRESHOLD_SEC = 120;
const SEGMENT_LENGTH_SEC = 40;

function asPath(uri: string): string {
  return uri.replace("file://", "");
}

function concatListContent(clips: ProcessedClip[]): string {
  return clips.map((clip) => `file '${asPath(clip.uri).replace(/'/g, "'\\''")}'`).join("\n");
}

function transitionFromTemplate(template: ProjectTemplate): TransitionType {
  if (template.motionStyle === "shake") return "dissolve";
  if (template.motionStyle === "pan") return "wipeleft";
  if (template.motionStyle === "zoom") return "slideright";
  return "fade";
}

export class RenderEngine {
  static async initialize(): Promise<void> {
    await ProcessingQueue.configure((args) => FfmpegExecutor.runInBackground(args), 2);
  }

  static async processUploadedAssets(assets: VideoAsset[]): Promise<ProcessedClip[]> {
    if (!assets.length) {
      throw new RenderEngineError("INVALID_INPUT", "No assets provided.");
    }

    const clips: ProcessedClip[] = [];
    await this.initialize();

    for (const asset of assets) {
      await MemoryOptimizer.guardInputFile(asset.uri);
      const trimmedPath = `${RNFS.CachesDirectoryPath}/${asset.id}_trimmed.mp4`;
      await ProcessingQueue.enqueue("trim", FfmpegCommandGenerator.trimLowActivity(asset.uri, trimmedPath));
      await LruStorageManager.touch(trimmedPath);

      const trimmedUri = `file://${trimmedPath}`;
      const durationSec = await FfmpegExecutor.getDurationSec(trimmedUri);
      let segments: string[] = [trimmedUri];

      if (durationSec > SPLIT_THRESHOLD_SEC) {
        const pattern = `${RNFS.CachesDirectoryPath}/${asset.id}_seg_%03d.mp4`;
        await ProcessingQueue.enqueue("split", FfmpegCommandGenerator.splitClip(trimmedUri, SEGMENT_LENGTH_SEC, pattern));
        const files = await RNFS.readDir(RNFS.CachesDirectoryPath);
        segments = files
          .filter((f) => f.name.startsWith(`${asset.id}_seg_`) && f.name.endsWith(".mp4"))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((f) => `file://${f.path}`);
      }

      for (const uri of segments) {
        const segDuration = await FfmpegExecutor.getDurationSec(uri);
        if (segDuration < MIN_CLIP_SEC) continue;
        clips.push({
          id: `clip_${Date.now()}_${clips.length}`,
          sourceAssetId: asset.id,
          uri,
          startSec: 0,
          endSec: segDuration,
          durationSec: segDuration
        });
        await LruStorageManager.touch(asPath(uri));
      }
    }

    await LruStorageManager.enforceLimit();
    await MemoryOptimizer.cleanupTempFiles(["concat_", "captions_"]);
    DebugLogger.info("RenderEngine", `Processed ${assets.length} assets into ${clips.length} clips.`);
    return clips;
  }

  static async mergeClips(clips: ProcessedClip[], outputName: string): Promise<string> {
    if (!clips.length) {
      throw new RenderEngineError("INVALID_INPUT", "No clips to merge.");
    }
    await this.initialize();

    const concatPath = `${RNFS.CachesDirectoryPath}/${outputName}_concat.txt`;
    const outPath = `${RNFS.CachesDirectoryPath}/${outputName}_merged.mp4`;
    await RNFS.writeFile(concatPath, concatListContent(clips), "utf8");

    await ProcessingQueue.enqueue("merge", FfmpegCommandGenerator.mergeConcat(concatPath, outPath));
    await LruStorageManager.touch(outPath);
    DebugLogger.info("RenderEngine", `Merged ${clips.length} clips into ${outPath}`);
    return `file://${outPath}`;
  }

  static async renderProject(params: {
    project: ProjectModel;
    searchQuery: string;
  }): Promise<string> {
    const { project, searchQuery } = params;
    if (!project.voiceOverUri) {
      throw new RenderEngineError("INVALID_INPUT", "Voice-over is required.");
    }
    if (!project.processedClips.length) {
      throw new RenderEngineError("INVALID_INPUT", "No processed clips available.");
    }
    await this.initialize();

    const template =
      project.selectedTemplateId
        ? TemplateEngineService.getAll().find((t) => t.id === project.selectedTemplateId)
        : undefined;
    const chosenTemplate = template ?? TemplateEngineService.autoSelectTemplate(project, searchQuery);
    const transition = transitionFromTemplate(chosenTemplate);
    let clipsForRender = project.processedClips;
    if (project.processedClips.length >= 2) {
      const transitionPath = `${RNFS.CachesDirectoryPath}/transition_${project.id}.mp4`;
      const first = project.processedClips[0];
      const second = project.processedClips[1];
      const offsetSec = Math.max(0.5, first.durationSec - 0.45);
      await ProcessingQueue.enqueue(
        "merge",
        FfmpegCommandGenerator.mergeWithTransition({
          inputAUri: first.uri,
          inputBUri: second.uri,
          outputPath: transitionPath,
          type: transition,
          durationSec: 0.35,
          offsetSec
        })
      );
      clipsForRender = [
        {
          id: `clip_transition_${project.id}`,
          sourceAssetId: first.sourceAssetId,
          uri: `file://${transitionPath}`,
          startSec: 0,
          endSec: first.durationSec + second.durationSec - 0.35,
          durationSec: first.durationSec + second.durationSec - 0.35
        },
        ...project.processedClips.slice(2)
      ];
    }

    const concatPath = `${RNFS.CachesDirectoryPath}/concat_${project.id}.txt`;
    await RNFS.writeFile(concatPath, concatListContent(clipsForRender), "utf8");

    const captionPath = await this.writeCaptionFile(project.id, project.captions);
    const outputPath = `${RNFS.DownloadDirectoryPath}/reel_${project.id}_916.mp4`;

    await ProcessingQueue.enqueue(
      "render",
      FfmpegCommandGenerator.exportWithTemplateAndAudio({
        clips: clipsForRender,
        concatListPath: concatPath,
        voiceOverUri: project.voiceOverUri,
        outputPath,
        captionsPath: captionPath,
        template: chosenTemplate,
        transition
      })
    );
    await LruStorageManager.touch(outputPath);
    DebugLogger.info("RenderEngine", `Render complete for ${project.id}`);
    return `file://${outputPath}`;
  }

  static queueSnapshot() {
    return ProcessingQueue.getJobs();
  }

  private static async writeCaptionFile(projectId: string, captions?: CaptionTrack): Promise<string | undefined> {
    if (!captions) return undefined;
    const srtPath = `${RNFS.CachesDirectoryPath}/captions_${projectId}.srt`;
    const srt = CaptionSyncService.toSrt(captions);
    await RNFS.writeFile(srtPath, srt, "utf8");
    return srtPath;
  }
}
