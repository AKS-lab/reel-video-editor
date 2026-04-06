import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecentProjectCount, getRecentProjectsPage, ProjectSummary } from '../state/projectStore';

const PAGE = 10;

/** Infinite scroll + lazy mount for recent projects (Module 1, 7). */
export function InfiniteProjectList(): JSX.Element {
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(() => {
    setItems((prev) => {
      const next = getRecentProjectsPage(prev.length, PAGE);
      if (next.length === 0) return prev;
      return [...prev, ...next];
    });
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const total = getRecentProjectCount();
          if (items.length < total) loadMore();
        }
      },
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, loadMore]);

  return (
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="h2">
        Recent projects
      </h2>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.75rem',
          padding: 0,
          margin: 0,
          listStyle: 'none',
        }}
      >
        {items.map((p) => (
          <li key={p.id}>
            <article className="card" style={{ padding: '0.75rem', minHeight: 88 }}>
              <div
                aria-hidden
                style={{
                  height: 48,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.title}</div>
              <div className="muted" style={{ fontSize: '0.75rem' }}>
                {new Date(p.updatedAt).toLocaleDateString()}
              </div>
            </article>
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
    </section>
  );
}
