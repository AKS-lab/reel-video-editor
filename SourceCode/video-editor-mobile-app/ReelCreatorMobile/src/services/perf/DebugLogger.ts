type LogLevel = "info" | "warn" | "error";

export type DebugLogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  source: string;
  message: string;
};

const MAX_LOGS = 200;
const listeners = new Set<(logs: DebugLogEntry[]) => void>();
let logs: DebugLogEntry[] = [];

function emit() {
  const snapshot = [...logs].sort((a, b) => b.ts - a.ts);
  for (const fn of listeners) fn(snapshot);
}

export class DebugLogger {
  static info(source: string, message: string) {
    this.add("info", source, message);
  }

  static warn(source: string, message: string) {
    this.add("warn", source, message);
  }

  static error(source: string, message: string) {
    this.add("error", source, message);
  }

  static subscribe(listener: (logs: DebugLogEntry[]) => void): () => void {
    listeners.add(listener);
    listener([...logs].sort((a, b) => b.ts - a.ts));
    return () => listeners.delete(listener);
  }

  static clear() {
    logs = [];
    emit();
  }

  private static add(level: LogLevel, source: string, message: string) {
    logs.push({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ts: Date.now(),
      level,
      source,
      message
    });
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(logs.length - MAX_LOGS);
    }
    emit();
  }
}
