/** Ring buffer debug log for troubleshooting (Module 6). */

const MAX = 500;
const entries: { t: number; level: 'debug' | 'info' | 'warn' | 'error'; msg: string; meta?: unknown }[] = [];

export function logDebug(message: string, meta?: unknown): void {
  push('debug', message, meta);
  if (import.meta.env.DEV) console.debug('[ReelCreator]', message, meta ?? '');
}

export function logInfo(message: string, meta?: unknown): void {
  push('info', message, meta);
  if (import.meta.env.DEV) console.info('[ReelCreator]', message, meta ?? '');
}

export function logWarn(message: string, meta?: unknown): void {
  push('warn', message, meta);
  console.warn('[ReelCreator]', message, meta ?? '');
}

export function logError(message: string, meta?: unknown): void {
  push('error', message, meta);
  console.error('[ReelCreator]', message, meta ?? '');
}

function push(level: typeof entries[0]['level'], msg: string, meta?: unknown): void {
  entries.push({ t: Date.now(), level, msg, meta });
  while (entries.length > MAX) entries.shift();
}

export function getDebugLog(): string {
  return entries
    .map((e) => `${new Date(e.t).toISOString()} [${e.level}] ${e.msg}${e.meta != null ? ` ${JSON.stringify(e.meta)}` : ''}`)
    .join('\n');
}

export function clearDebugLog(): void {
  entries.length = 0;
}

export function exportDebugLogBlob(): Blob {
  return new Blob([getDebugLog()], { type: 'text/plain;charset=utf-8' });
}
