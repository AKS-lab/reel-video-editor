type FFmpegRuntime = {
  FFmpegKit: {
    execute: (command: string) => Promise<any>;
    executeAsync: (command: string, callback: (session: any) => void) => void;
  };
  FFprobeKit: {
    getMediaInformation: (uri: string) => Promise<any>;
  };
  ReturnCode: {
    isSuccess: (code: any) => boolean;
  };
};

export function getFfmpegRuntime(): FFmpegRuntime | null {
  try {
    // Optional runtime dependency to avoid Android build failure when native artifact repository is unreachable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("ffmpeg-kit-react-native") as FFmpegRuntime;
  } catch {
    return null;
  }
}
