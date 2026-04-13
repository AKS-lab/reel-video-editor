export type RenderErrorCode =
  | "INVALID_INPUT"
  | "FFMPEG_FAILURE"
  | "QUEUE_FAILURE"
  | "IO_FAILURE"
  | "CANCELLED";

export class RenderEngineError extends Error {
  code: RenderErrorCode;
  causeMessage?: string;

  constructor(code: RenderErrorCode, message: string, causeMessage?: string) {
    super(message);
    this.code = code;
    this.causeMessage = causeMessage;
  }
}
