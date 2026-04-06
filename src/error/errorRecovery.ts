/**
 * Crash / memory recovery notifier (Module 6).
 * After three auto-recoveries in a session, surface restart prompt.
 */

import { logError, logWarn } from '../debug/debugLog';

let recoveryCount = 0;
const MAX_AUTO = 3;

export type RecoveryNotification = {
  kind: 'recover' | 'restart_required';
  message: string;
  count: number;
};

const listeners = new Set<(n: RecoveryNotification) => void>();

export function subscribeRecovery(cb: (n: RecoveryNotification) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(n: RecoveryNotification): void {
  listeners.forEach((cb) => {
    try {
      cb(n);
    } catch {
      /* ignore */
    }
  });
}

/** Call after a handled crash or OOM-style failure. */
export function recordAutoRecovery(context: string): void {
  recoveryCount += 1;
  logWarn(`Auto-recovery (${recoveryCount}/${MAX_AUTO})`, { context });
  if (recoveryCount >= MAX_AUTO) {
    notify({
      kind: 'restart_required',
      message:
        'Persistent errors after recovery attempts. Please restart the app to clear memory and retry.',
      count: recoveryCount,
    });
  } else {
    notify({
      kind: 'recover',
      message: 'A problem was recovered automatically. If issues continue, try clearing cache in Settings.',
      count: recoveryCount,
    });
  }
}

/** Reset counter after full app restart (optional hook). */
export function resetRecoverySession(): void {
  recoveryCount = 0;
}

/** Global safety net for unhandled errors (call once from main). */
export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (ev) => {
    logError('window.error', { message: ev.message, filename: ev.filename, lineno: ev.lineno });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    logError('unhandledrejection', { reason: String(ev.reason) });
  });
}
