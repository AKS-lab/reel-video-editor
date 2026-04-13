# Dual-Platform Video Editor SourceCode

This folder contains the Step 1 architecture implementation for a dual-platform short-form video editor.

## Platforms

- Mobile runtime: React Native CLI + TypeScript + native FFmpeg bridge.
- Web runtime: HTML + CSS + Vanilla JS with worker-based media processing.

## Design goals

- Shared deterministic media planning across platforms.
- Strict background processing for heavy media operations.
- Stable storage with a 2GB bounded cache and LRU eviction.
- Export reliability and observability.

## Folder map

- `docs/`: architecture and systems documentation.
- `shared/`: platform-agnostic contracts and planning core.
- `video-editor-mobile-app/`: React Native architecture skeleton and native FFmpeg boundary.
- `video-editor-web-app/`: Vanilla JS architecture skeleton and worker boundaries.
