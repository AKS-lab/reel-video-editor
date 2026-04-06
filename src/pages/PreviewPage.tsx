import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GestureVideoPlayer } from '../components/GestureVideoPlayer';
import { buildSyncFromVoiceAndCaption, loopCuesToDuration } from '../audio/sync';
import { globalRenderQueue } from '../render/renderQueue';
import { logInfo } from '../debug/debugLog';

/** Module 5: scrub = motion+background; full = text + VO + music. Export 9:16 messaging. */
export function PreviewPage(): JSX.Element {
  const [mode, setMode] = useState<'scrub' | 'full'>('scrub');
  const [lowPreview, setLowPreview] = useState(true);

  const sync = useMemo(
    () => buildSyncFromVoiceAndCaption(['One', 'word', 'at', 'a', 'time'], 8, 0.9),
    []
  );
  const looped = useMemo(
    () => loopCuesToDuration(sync.cues, 24, 8),
    [sync.cues]
  );

  const queuePreview = (): void => {
    globalRenderQueue.enqueue({
      id: `prev-${Date.now()}`,
      label: 'Quick preview',
      quality: 'preview_low',
      run: async () => {
        logInfo('Render preview (low-res text/audio optional)', { lowPreview });
        await new Promise((r) => setTimeout(r, 400));
      },
    });
  };

  const queueExport = (): void => {
    globalRenderQueue.enqueue({
      id: `export-${Date.now()}`,
      label: 'Full export 9:16',
      quality: 'full',
      run: async () => {
        logInfo('Export 9:16 for Instagram / YouTube Shorts');
        await new Promise((r) => setTimeout(r, 800));
      },
    });
  };

  return (
    <div className="stack">
      <h1 className="h1">Preview & export</h1>
      <p className="muted">
        Real-time scrubbing shows motion and background only. Full preview adds captions, voice-over, and genre music.
        Export is vertical 9:16 — you will be notified when rendering completes.
      </p>

      <div className="row">
        <button
          type="button"
          className={`btn ${mode === 'scrub' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('scrub')}
        >
          Scrub preview
        </button>
        <button
          type="button"
          className={`btn ${mode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('full')}
        >
          Full preview
        </button>
      </div>

      <div style={{ maxWidth: 360, margin: '0 auto' }}>
        <GestureVideoPlayer mode={mode === 'scrub' ? 'scrub_low' : 'full'} src={undefined} />
      </div>

      {mode === 'full' && (
        <section className="card" aria-label="Caption sync sample">
          <div className="h2">Word sync sample</div>
          <p className="muted">{sync.mode === 'subtitles_fallback' ? sync.message : 'Word sync active.'}</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {looped.slice(0, 8).map((c, i) => (
              <li key={`${c.start}-${i}`}>
                <span style={{ fontWeight: 600 }}>{c.word}</span>{' '}
                <span className="muted">
                  {c.start.toFixed(2)}s–{c.end.toFixed(2)}s
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <label className="row" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={lowPreview} onChange={(e) => setLowPreview(e.target.checked)} />
        <span>Quick render preview (low-resolution text and audio)</span>
      </label>

      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={queuePreview}>
          Queue quick preview
        </button>
        <button type="button" className="btn btn-primary" onClick={queueExport}>
          Queue full export
        </button>
      </div>

      <section className="card stack">
        <div className="h2">Sharing</div>
        <p className="muted">Direct share (Web Share API when available) or save locally.</p>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'ReelCreator export', text: 'Vertical 9:16 video' });
                } catch {
                  /* user cancelled */
                }
              } else {
                alert('Sharing not available on this device — use Save after export.');
              }
            }}
          >
            Share
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => alert('Save: connect export blob download.')}>
            Save locally
          </button>
        </div>
      </section>

      <Link to="/settings" className="btn btn-ghost">
        Debug log & settings
      </Link>
      <Link to="/" className="btn btn-ghost">
        Home
      </Link>
    </div>
  );
}
