# Step 8 - Final Test Checklist

## What you are validating

Final end-to-end validation for:

- Web demo app (`SourceCode/video-editor-web-app`)
- Android app (`SourceCode/video-editor-mobile-app/ReelCreatorMobile`)

---

## WEB CHECKLIST

### 1) Opens instantly

- [ ] Double-click `SourceCode/video-editor-web-app/index.html`
- [ ] First paint appears without build/install step
- [ ] No console errors on load

Expected:
- Home screen appears immediately.

### 2) UI works

- [ ] New Project button resets simulation state
- [ ] Mock Video Upload updates status
- [ ] Start Fake Processing animates progress to completion
- [ ] Template cards can be selected visually
- [ ] Preview Simulation runs and completes

Expected:
- All module interactions respond smoothly with no broken controls.

### 3) Navigation works

- [ ] Home actions (`New Project`, `Recent`, `Templates`) update content correctly
- [ ] No dead buttons
- [ ] Mobile viewport responsiveness (<860px) remains usable

Expected:
- Demo flow remains functional across desktop/mobile browser sizes.

---

## ANDROID CHECKLIST

### 1) APK builds successfully

From `SourceCode/video-editor-mobile-app/ReelCreatorMobile`:

- [ ] `npm install`
- [ ] `cp android/local.properties.example android/local.properties`
- [ ] Configure `sdk.dir` in `android/local.properties`
- [ ] `npm run android:debug`
- [ ] `npm run android:release`

Expected:
- `app-debug.apk` and `app-release.apk` generated.

### 2) Installs on real device

- [ ] Enable USB debugging on Android device
- [ ] `adb devices` shows device
- [ ] `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] `adb install -r android/app/build/outputs/apk/release/app-release.apk`

Expected:
- APK installs successfully and app launches.

### 3) Video processing works

- [ ] Upload one short video (<2 min) and one long video (>2 min)
- [ ] Run processing pipeline
- [ ] Verify auto-trim runs
- [ ] Verify long clip splits into ~40s clips
- [ ] Verify clips <10s are discarded
- [ ] Verify queue status updates and retries on failure

Expected:
- FFmpeg pipeline completes and produces retained clips list.

### 4) No crashes

- [ ] Run repeated processing jobs (at least 10)
- [ ] Force-close app during processing
- [ ] Re-open app and verify queue recovery
- [ ] Verify failed jobs do not exceed 3 retries
- [ ] Verify app remains responsive during background queue activity

Expected:
- No fatal app crashes in test cycle; failed jobs recover or fail gracefully.

---

## Known issues and fixes

### Issue A: Build environment blockers on host machine

Status:
- `unsure` in this session for full APK build execution because prior environment checks reported missing Java runtime / incompatible local setup.

Fix:
1. Install JDK 17.
2. Install Android SDK + platform tools.
3. Set `ANDROID_HOME` / SDK path in `android/local.properties`.
4. Use supported Node/npm for current RN project.

### Issue B: Absolute zero-crash guarantee

Status:
- `unsure` for universal “no crashes” across all OEM/codec combinations without matrix testing.

Fix:
1. Run the Android checklist on at least 3 device classes (low/mid/high).
2. Keep queue concurrency at 2 and retries at 3.
3. Review Debug Logging Panel output for repeated FFmpeg failure signatures.

### Issue C: Large input safety

Status:
- Guardrails implemented, but thresholds may require tuning per real-device constraints.

Fix:
1. Stress test with 1080p and 4K source files.
2. If OOM/ANR risk appears, lower concurrency to 1 for that device tier.
3. Increase cleanup cadence in `MemoryOptimizer.cleanupTempFiles`.

---

## How to run this checklist quickly

1. Validate Web section in browser.
2. Validate Android build/install/process/no-crash sections on a real device.
3. Record each checkbox as pass/fail.
4. For any fail, apply the mapped fix above and retest the same case.
