import { useEffect, useRef, useState } from 'react';
import { PRELOADED_TEMPLATES } from '../templates/genreTemplates';
import { touchTemplate } from '../state/projectStore';

/** Vertical strip with lazy-loaded cards (Module 1). */
export function TrendingTemplates(): JSX.Element {
  const [visible, setVisible] = useState(6);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visible < PRELOADED_TEMPLATES.length) {
          setVisible((v) => Math.min(v + 4, PRELOADED_TEMPLATES.length));
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <section aria-labelledby="trending-heading">
      <h2 id="trending-heading" className="h2">
        Trending templates
      </h2>
      <div
        ref={wrapRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: 320,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {PRELOADED_TEMPLATES.slice(0, visible).map((t) => (
          <button
            key={t.id}
            type="button"
            className="card"
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
            onClick={() => touchTemplate(t.id)}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {t.genre} · viral {Math.round(t.viralScore * 100)}%
              </div>
            </div>
            <span className="muted" style={{ fontSize: '0.75rem' }}>
              {t.backgroundTag}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
