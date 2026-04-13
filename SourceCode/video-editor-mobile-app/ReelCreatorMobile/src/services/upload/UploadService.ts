import DocumentPicker from "react-native-document-picker";
import { VideoAsset } from "../../types";
import { FfmpegExecutor } from "../video/FfmpegExecutor";

export async function pickVideoAssets(): Promise<VideoAsset[]> {
  const picked = await DocumentPicker.pick({
    allowMultiSelection: true,
    type: [DocumentPicker.types.video]
  });

  const assets: VideoAsset[] = [];
  for (const file of picked) {
    const uri = file.fileCopyUri ?? file.uri;
    const durationSec = await FfmpegExecutor.getDurationSec(uri);
    assets.push({
      id: `asset_${Date.now()}_${assets.length}`,
      uri,
      durationSec,
      createdAt: Date.now()
    });
  }

  return assets;
}
