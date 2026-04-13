import { ProcessedClip, VideoAsset } from "../../types";
import { RenderEngine } from "../render/RenderEngine";

export class VideoProcessingService {
  static async processAssets(assets: VideoAsset[]): Promise<ProcessedClip[]> {
    return RenderEngine.processUploadedAssets(assets);
  }
}
