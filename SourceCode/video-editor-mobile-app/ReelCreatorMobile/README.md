# ReelCreatorMobile (Step 4 Core)

React Native + FFmpeg Android core implementing:

- Module 1 UI: home, new project, recents, template browse, search suggestions
- Gestures: double tap +-10s, pinch timeline zoom, center play/pause
- Module 2 Processing: upload, FFmpeg auto-trim heuristic, split, discard short clips
- Storage: 2GB max cache with LRU cleanup
- Module 3 Template engine: text/motion/background styles, viral scoring, auto-select
- Module 4 Audio: voice-over required, word sync captions, fallback subtitles
- Module 5 Preview: low-res real-time preparation + full mode
- Module 6 Export: 9:16 output for Reels/Shorts
- Step 5 Render Engine: command generator, persisted processing queue, background execution, error system

## Dependencies

- Runtime: `react`, `react-native`
- Processing: `ffmpeg-kit-react-native`, `react-native-fs`
- Upload: `react-native-document-picker`
- State/persistence: `@react-native-async-storage/async-storage`
- Gestures: `react-native-gesture-handler`, `react-native-reanimated`
- Runtime support: `react-native-safe-area-context`, `react-native-screens`

## FFmpeg render engine

- Command generation: `src/services/render/FfmpegCommandGenerator.ts`
- Queue (persisted): `src/services/render/ProcessingQueue.ts`
- Engine orchestration: `src/services/render/RenderEngine.ts`
- Error model: `src/services/render/RenderErrors.ts`

Supported operations:
- trimming
- splitting
- merging
- text overlays (captions via subtitles filter)
- audio sync (voice-over + caption track)
- transitions (`fade`, `wipeleft`, `slideright`, `dissolve`)

## Step 6 performance + recovery

- Multi-threaded queue workers: 2 concurrent FFmpeg jobs
- Background queue execution with persisted state
- Crash auto-recovery: running jobs are recovered and retried (max 3 attempts)
- Memory protection for large files (4GB profile guardrails)
- 2GB LRU cache with proactive cleanup
- Debug logging panel available inside the app

## Install

```bash
npm install
cp android/local.properties.example android/local.properties
```

Set Android SDK path in `android/local.properties`.

## Run (debug)

```bash
npm start
npm run android
```

## Build APK

```bash
npm run android:debug
npm run android:release
```

## Real device install

```bash
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Release signing

Set these in `android/gradle.properties`:

- `MYAPP_UPLOAD_STORE_FILE`
- `MYAPP_UPLOAD_KEY_ALIAS`
- `MYAPP_UPLOAD_STORE_PASSWORD`
- `MYAPP_UPLOAD_KEY_PASSWORD`
