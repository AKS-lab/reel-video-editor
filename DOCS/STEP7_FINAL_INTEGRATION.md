# Step 7 - Final Integration (Web + APK)

## What you are building

One integrated system with two deployable clients:

- Web demo client (instant launch): `SourceCode/video-editor-web-app/index.html`
- Android production client (React Native + FFmpeg): `SourceCode/video-editor-mobile-app/ReelCreatorMobile`

Integration mode used: orchestration + shared contracts/services alignment.

## Integrated structure

```text
SourceCode/
├── video-editor-web-app/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── app/RuntimeOrchestrator.js
│   └── workers/WorkerContract.js
└── video-editor-mobile-app/
    ├── app/RuntimeOrchestrator.ts
    ├── native/ffmpeg/FFmpegBridgeContract.ts
    └── ReelCreatorMobile/
        ├── src/...
        └── android/...
```

## Integration highlights

- Web remains demo-only UI and launches directly from `index.html` with no build tool.
- Android pipeline integrates:
  - upload service,
  - template engine,
  - audio caption sync,
  - FFmpeg render engine with queue + retry + recovery.
- Processing queue is persisted and recovers in-flight jobs after restart.
- FFmpeg health check is executed at app startup.
- LRU cache + memory guardrail are active for low-end stability.

## Defect fixes completed in final integration

- Queue persistence growth bug: added pruning of finished jobs.
- Crash/restart recovery reliability: running jobs are recovered as queued.
- Retry safety: capped at 3 attempts per job.
- Observability gap: debug logging panel wired to queue/render/memory services.

## How to run web version

No install needed for static launch.

Option A (instant):
- Open `SourceCode/video-editor-web-app/index.html` in browser.

Option B (recommended local server):
- `npx serve SourceCode/video-editor-web-app -l 4173`
- open `http://localhost:4173`

## How to build APK

From:
- `SourceCode/video-editor-mobile-app/ReelCreatorMobile`

Install dependencies:
- `npm install`

Set Android SDK path:
- `cp android/local.properties.example android/local.properties`
- edit `android/local.properties` -> `sdk.dir=...`

Build:
- Debug APK: `npm run android:debug`
- Release APK: `npm run android:release`

## How to install APK on Android device

1. Enable Developer Options + USB debugging.
2. Connect device and verify:
   - `adb devices`
3. Install debug APK:
   - `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
4. Install release APK:
   - `adb install -r android/app/build/outputs/apk/release/app-release.apk`

## Stability notes

- Queue concurrency is set to 2 workers (per requirement).
- Retry + recovery are enabled (max 3 retries).
- Heavy media processing stays in FFmpeg/native layer.
- `unsure`: absolute zero-crash guarantee is not possible across all OEM firmware/codec edge cases, but crash resilience and recovery are implemented.
