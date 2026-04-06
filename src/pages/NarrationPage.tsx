import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildSyncFromVoiceAndCaption } from '../audio/sync';

/**
 * Module 4: Voice-over required (user upload). Gameplay audio muted in export.
 * Word-by-word sync with subtitles fallback notification.
 */
export function NarrationPage(): JSX.Element {
  const [alert, setAlert] = useState<string | null>(null);
  const [cuesPreview, setCuesPreview] = useState<string>('');

  const onVoice = (file: File | null) => {
    setAlert(null);
    setCuesPreview('');
    if (!file) return;
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration || 0;
      URL.revokeObjectURL(url);
      const sync = buildSyncFromVoiceAndCaption(['Hook', 'build', 'payoff'], dur, 0.2);
      if (sync.mode === 'subtitles_fallback') {
        setAlert(sync.message);
      }
      setCuesPreview(
        sync.cues.map((c) => `${c.word}: ${c.start.toFixed(2)}s`).join(' · ')
      );
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setAlert('Could not decode voice track. Try WAV or MP3.');
    };
  };

  return (
    <div className="stack">
      <h1 className="h1">Music & narration</h1>
      <p className="muted">
        Upload your voice-over. Genre music is preloaded in the renderer; gameplay audio is muted on export. If sync is
        impossible, subtitles are used and you are notified here.
      </p>

      <section className="card stack">
        <label className="h2" htmlFor="vo">
          Voice-over (required)
        </label>
        <input id="vo" type="file" accept="audio/*" onChange={(e) => onVoice(e.target.files?.[0] ?? null)} />
        {alert && (
          <div role="alert" className="muted">
            {alert}
          </div>
        )}
        {cuesPreview && (
          <p className="muted" style={{ wordBreak: 'break-word' }}>
            Cue preview: {cuesPreview}
          </p>
        )}
      </section>

      <section className="card stack">
        <div className="h2">Optional: highlight spoken word in preview render</div>
        <p className="muted">Enable in export settings when full preview runs (word index driven by sync cues).</p>
      </section>

      <div className="row">
        <Link to="/project/new" className="btn btn-ghost">
          Back
        </Link>
        <Link to="/preview" className="btn btn-primary">
          Preview
        </Link>
      </div>
    </div>
  );
}
