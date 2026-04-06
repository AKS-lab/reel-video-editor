import { useMemo, useState } from 'react';

type Props = {
  items: string[];
  placeholder?: string;
  onPick?: (value: string) => void;
  id?: string;
};

/** Live suggestions with matched text highlighted (Module 1). */
export function SearchSuggestions({ items, placeholder, onPick, id = 'search-suggest' }: Props): JSX.Element {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items.slice(0, 8);
    return items.filter((s) => s.toLowerCase().includes(t)).slice(0, 12);
  }, [items, q]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <label htmlFor={id} className="sr-only">
        Search templates and projects
      </label>
      <input
        id={id}
        type="search"
        className="card"
        placeholder={placeholder ?? 'Search…'}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        role="combobox"
        aria-autocomplete="list"
      />
      {open && filtered.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="card"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 4px)',
            margin: 0,
            padding: '0.35rem 0',
            listStyle: 'none',
            zIndex: 20,
            maxHeight: 240,
            overflowY: 'auto',
            animation: 'fadeSlide 0.18s ease',
          }}
        >
          {filtered.map((item) => (
            <li key={item} role="option">
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  borderRadius: 8,
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ(item);
                  onPick?.(item);
                  setOpen(false);
                }}
              >
                <Highlight text={item} query={q} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }): JSX.Element {
  const t = query.trim();
  if (!t) return <span>{text}</span>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(t.toLowerCase());
  if (idx < 0) return <span>{text}</span>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + t.length);
  const after = text.slice(idx + t.length);
  return (
    <span>
      {before}
      <mark style={{ background: 'var(--accent-2)', color: '#0a0a10' }}>{match}</mark>
      {after}
    </span>
  );
}
