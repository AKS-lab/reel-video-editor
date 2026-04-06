import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSettings } from '../state/AppSettings';
import { getDebugLog, clearDebugLog, exportDebugLogBlob } from '../debug/debugLog';
import { getStorageEstimate, clearTempBuffers, MAX_BYTES } from '../storage/clipStorage';
import { LRUCache } from '../cache/lruCache';
import { recordAutoRecovery, resetRecoverySession } from '../error/errorRecovery';

const demoCache = new LRUCache<string, string>(64);

export function SettingsPage(): JSX.Element {
  const { settings, setSettings, toggleTheme } = useAppSettings();
  const [logText, setLogText] = useState(() => getDebugLog());
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);

  const estLabel = useMemo(() => {
    if (!est) return 'Unknown';
    const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${mb(est.usage)} / ${mb(est.quota)}`;
  }, [est]);

  useEffect(() => {
    void getStorageEstimate().then(setEst);
  }, []);

  return (
    <div className="stack">
      <h1 className="h1">Settings</h1>

      <section className="card stack" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="h2">
          Appearance & accessibility
        </h2>
        <label className="row">
          <span>Theme</span>
          <button type="button" className="btn btn-ghost" onClick={toggleTheme}>
            {settings.theme === 'dark' ? 'Dark' : 'Light'} (toggle)
          </button>
        </label>
        <label className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span>Color blindness mode</span>
          <select
            value={settings.colorBlind}
            onChange={(e) =>
              setSettings({
                colorBlind: e.target.value as typeof settings.colorBlind,
              })
            }
          >
            <option value="off">Off</option>
            <option value="protanopia">Protanopia-safe palette</option>
            <option value="deuteranopia">Deuteranopia-safe palette</option>
            <option value="tritanopia">Tritanopia-safe palette</option>
          </select>
        </label>
        <label className="row" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => setSettings({ highContrast: e.target.checked })}
          />
          <span>High contrast</span>
        </label>
      </section>

      <section className="card stack" aria-labelledby="general-heading">
        <h2 id="general-heading" className="h2">
          General
        </h2>
        <label className="row" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => setSettings({ notificationsEnabled: e.target.checked })}
          />
          <span>Notifications (export complete, recoveries)</span>
        </label>
        <label className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span>Language</span>
          <select value={settings.language} onChange={(e) => setSettings({ language: e.target.value })}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>
      </section>

      <section className="card stack" aria-labelledby="storage-heading">
        <h2 id="storage-heading" className="h2">
          Storage & cache
        </h2>
        <p className="muted">IndexedDB clip budget: {MAX_BYTES / (1024 * 1024 * 1024)} GB (oldest clips removed first).</p>
        <p className="muted">Browser estimate: {estLabel}</p>
        <div className="row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              demoCache.clear();
              await clearTempBuffers();
              void getStorageEstimate().then(setEst);
            }}
          >
            Clear temp buffers & demo cache
          </button>
        </div>
      </section>

      <section className="card stack" aria-labelledby="debug-heading">
        <h2 id="debug-heading" className="h2">
          Debug log (Module 6)
        </h2>
        <label htmlFor="debug-area" className="sr-only">
          Debug log contents
        </label>
        <textarea
          id="debug-area"
          readOnly
          value={logText}
          rows={8}
          style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
        />
        <div className="row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setLogText(getDebugLog());
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              clearDebugLog();
              setLogText('');
            }}
          >
            Clear log
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const blob = exportDebugLogBlob();
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `reelcreator-debug-${Date.now()}.txt`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download log
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              recordAutoRecovery('manual_test');
              setLogText(getDebugLog());
            }}
          >
            Simulate recovery
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => resetRecoverySession()}>
            Reset recovery counter
          </button>
        </div>
      </section>

      <Link to="/" className="btn btn-ghost">
        Back home
      </Link>
    </div>
  );
}
