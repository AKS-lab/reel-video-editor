# Threading Model

## Mobile runtime (React Native CLI + TypeScript + native FFmpeg)

- JS main thread responsibilities:
  - project state transitions,
  - timeline plan updates,
  - dispatching background processing jobs.
- UI thread responsibilities:
  - visual rendering and gesture response only.
- Native background workers:
  - FFmpeg execution,
  - heavy file IO,
  - waveform extraction,
  - thumbnail generation.

### Mobile thread safety rules

- No synchronous media transforms on JS main thread.
- All native FFmpeg calls are queued through one scheduler.
- Shared mutable state updates happen through single state reducer pipeline.

## Web runtime (HTML + CSS + Vanilla JS)

- Main thread responsibilities:
  - DOM interactions,
  - input handling,
  - lightweight orchestration.
- Worker responsibilities:
  - metadata extraction,
  - timeline precompute,
  - thumbnail and waveform processing,
  - expensive frame loop calculations.

### Web thread safety rules

- Main thread receives immutable snapshots from workers.
- Worker pool uses bounded concurrency from hardware hints.
- CPU-heavy loops and parse operations never run on main thread.

## Queue model

- `previewQueue`: short operations with low latency budget.
- `processQueue`: medium operations for derived artifacts.
- `exportQueue`: long-running, one active export per project.

All queues emit lifecycle events:
- queued,
- running,
- succeeded,
- failed,
- cancelled.
