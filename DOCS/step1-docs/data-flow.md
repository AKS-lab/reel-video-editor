# Data Flow

## Upload -> Process -> Preview -> Export

### 1) Upload

- Mobile path:
  - Media URI selected from device.
  - File copied into app-managed storage zone.
  - Source record stored in project state.
- Web path:
  - Files selected from browser input or drag-and-drop.
  - Object URL created for immediate read access.
  - Metadata extraction delegated to worker.
  - Source record persisted in IndexedDB metadata tables.

### 2) Process

- Shared `TimelinePlanner` normalizes clip ordering and timing windows.
- `ExportPlanBuilder` computes deterministic render graph from timeline and output profile.
- `StorageIndex` checks for reusable derived artifacts before scheduling work.
- Processing scheduler emits tasks for:
  - proxy generation,
  - thumbnail strips,
  - waveform extraction,
  - audio normalization.

### 3) Preview

- Preview consumes cached proxies and timeline slices.
- Main thread/JS thread only performs orchestration and render coordination.
- Decoding and heavy precompute stay in native/background workers.
- Timeline scrubbing reads from nearest cached segment for low-latency updates.

### 4) Export

- Shared export plan produces FFmpeg-compatible command graph and IO contract.
- Mobile:
  - Plan translated through RN-native bridge.
  - FFmpeg executes in background queue.
  - Result path and status journal persisted.
- Web:
  - Browser capability-gated export route is selected.
  - Unsupported codec/feature combinations are reported as `unsure`.
  - Export output persisted as downloadable blob artifact.

## Reliability controls

- Every stage writes job status into a durable job journal.
- Stage retries use bounded exponential backoff.
- Cache misses only trigger recompute for missing segments, not full pipeline reruns.
