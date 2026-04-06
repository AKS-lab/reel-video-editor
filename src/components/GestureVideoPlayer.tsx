import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';

type Mode = 'scrub_low' | 'full';

type Props = {
  src: string | undefined;
  mode: Mode;
  className?: string;
};

/**
 * Double-tap left/right ±10s (Module 1, 5), pinch zoom on timeline (subtle), centered play/pause.
 * Real-time scrub: motion/background emphasis — use low resolution / hide text overlay via mode.
 */
export function GestureVideoPlayer({ src, mode, className }: Props): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<{ t: number; x: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);

  const skip = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    setFeedback(delta > 0 ? '+10s' : '-10s');
    window.setTimeout(() => setFeedback(null), 600);
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const now = Date.now();
      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX;
      const last = lastTapRef.current;
      if (last && now - last.t < 320 && Math.abs(x - last.x) < 40) {
        const side = rect ? x < rect.left + rect.width / 2 : x < window.innerWidth / 2;
        skip(side ? -10 : 10);
        lastTapRef.current = null;
        return;
      }
      lastTapRef.current = { t: now, x };
    },
    [skip]
  );

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) => Math.min(1.5, Math.max(1, z + (e.deltaY > 0 ? -0.05 : 0.05))));
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
        touchAction: 'manipulation',
      }}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          playsInline
          muted={mode === 'scrub_low'}
          style={{
            width: '100%',
            display: 'block',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease',
            filter: mode === 'scrub_low' ? 'saturate(0.85) contrast(1.05)' : 'none',
          }}
          aria-label={mode === 'scrub_low' ? 'Preview: motion and background only' : 'Full preview with audio'}
        />
      ) : (
        <div style={{ aspectRatio: '9/16', maxHeight: 420 }} aria-hidden />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          style={{ pointerEvents: 'auto', opacity: 0.92 }}
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) {
              void v.play();
              setPlaying(true);
            } else {
              v.pause();
              setPlaying(false);
            }
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            padding: '0.35rem 0.75rem',
            borderRadius: 999,
            fontSize: '0.9rem',
          }}
        >
          {feedback}
        </div>
      )}

      <div className="sr-only">
        Double-tap left or right to skip ten seconds. Pinch or control-scroll to zoom timeline.
      </div>
    </div>
  );
}
