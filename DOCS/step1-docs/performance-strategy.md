# Performance Strategy

## Objectives

- Keep timeline preview responsive under heavy projects.
- Bound memory and storage growth with deterministic cache policy.
- Maintain stable export completion under interruptions.

## Preview performance

- Prefer proxy clips for timeline playback and scrub interactions.
- Cache timeline-visible thumbnails and waveforms in bounded chunks.
- Preload only adjacent timeline windows to avoid overfetch.
- Debounce scrub updates and coalesce rapid edit events.

## Processing performance

- Deduplicate jobs by transform hash.
- Use bounded worker concurrency:
  - mobile uses thermal-aware queue sizing,
  - web uses CPU core hints with conservative cap.
- Run incremental recompute for changed segments only.

## Export stability and throughput

- Enforce one active export per project.
- Persist export job checkpoints and status transitions.
- Retry transient failures with bounded backoff.
- Return structured error codes for unsupported codec, storage full, invalid input, and interruption.

## Observability

- Track stage latency:
  - upload metadata parse,
  - process queue wait time,
  - processing duration,
  - export duration.
- Track cache hit rate and eviction frequency.
- Track queue depth and failure code histograms.
- Persist a crash-safe job journal for post-restart recovery.

## Runtime capability constraints

- `unsure`: exact browser codec matrix and bitrate controls vary by browser and OS.
- `unsure`: hardware acceleration availability on all Android devices is not guaranteed.
