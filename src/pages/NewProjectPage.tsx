import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adviseConversion } from '../video/formatConversion';
import {
  isMimeSupported,
  MAX_SINGLE_UPLOAD_SEC,
  MIN_CLIP_SEC,
  planSegments,
  rejectResolutionMessage,
  validateVideoResolution,
} from '../video/clipProcessor';
import { saveClip, saveTempBuffer } from '../storage/clipStorage';
import { logError } from '../debug/debugLog';
import { recordAutoRecovery } from '../error/errorRecovery';
import { pickTemplateForStory } from '../templates/genreTemplates';
import type { GenreId } from '../templates/genreTemplates';

export function NewProjectPage(): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [segments, setSegments] = useState<string | null>(null);
  const [genre] = useState<GenreId>('gaming');

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setStatus(null);
      setSegments(null);

      const conv = adviseConversion(file);
      if (!conv.ok) {
        setStatus(conv.reason);
        return;
      }
      if (!isMimeSupported(file.type)) {
        setStatus('Unsupported format. Please use MP4 or WebM.');
        return;
      }

      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('decode'));
        });
      } catch {
        URL.revokeObjectURL(url);
        setStatus('Could not read video. Try converting to MP4.');
        recordAutoRecovery('video_metadata');
        return;
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      const dur = video.duration || 0;
      URL.revokeObjectURL(url);

      if (!validateVideoResolution(w, h)) {
        setStatus(rejectResolutionMessage());
        return;
      }

      if (dur > MAX_SINGLE_UPLOAD_SEC * 10) {
        setStatus('File extremely long; trim before upload for best results.');
      }

      const result = planSegments(dur);
      if (!result.ok) {
        if (result.reason === 'too_short') {
          setStatus(result.detail ?? `Clips under ${MIN_CLIP_SEC}s are discarded.`);
        } else {
          setStatus('Invalid clip.');
        }
        return;
      }

      const template = pickTemplateForStory(genre, 12);
      setSegments(
        `Planned ${result.segments.length} segment(s). Gameplay trim: ${result.gameplayTrimmed ? 'yes' : 'no'}. Template: ${template.name}.`
      );

      try {
        await saveTempBuffer(`upload-${Date.now()}`, file);
        await saveClip({
          id: `clip-${Date.now()}`,
          blob: file,
          name: file.name,
          createdAt: Date.now(),
          size: file.size,
          durationSec: dur,
        });
        setStatus('Clip stored. Templates apply automatically; you can override in the editor.');
      } catch (e) {
        logError('saveClip', e);
        recordAutoRecovery('indexeddb_save');
        setStatus('Storage error — recovery attempted. Retry or clear cache in Settings.');
      }
    },
    [genre]
  );

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="h1">New project</h1>
          <p className="muted">Select or upload gameplay / loop background.</p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <section className="card stack" aria-label="Clip selection">
        <p>
          Preloaded templates are available after upload. Clips longer than {MAX_SINGLE_UPLOAD_SEC}s are split into{' '}
          {30}–{45}s segments after slow sections are removed (simulated). Shorter than {MIN_CLIP_SEC}s is rejected.
        </p>
        {status && (
          <div role="status" className="muted">
            {status}
          </div>
        )}
        {segments && <div className="muted">{segments}</div>}
      </section>

      <nav className="row">
        <Link to="/" className="btn btn-ghost">
          Back
        </Link>
        <Link to="/narration" className="btn btn-primary">
          Continue to voice & music
        </Link>
      </nav>
    </div>
  );
}
