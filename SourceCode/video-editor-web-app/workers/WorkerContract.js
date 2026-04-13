/**
 * Worker contract for heavy processing.
 * Main thread posts immutable payloads; worker returns immutable results.
 */

export const WorkerTaskType = {
  EXTRACT_METADATA: "extract_metadata",
  GENERATE_WAVEFORM: "generate_waveform",
  GENERATE_THUMBNAILS: "generate_thumbnails",
  BUILD_PROXY: "build_proxy"
};

export function createWorkerRequest(taskType, payload) {
  return {
    taskType,
    payload,
    createdAtMs: Date.now()
  };
}
