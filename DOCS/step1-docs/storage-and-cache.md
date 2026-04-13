# Storage And Cache

## Storage tiers

1. Source media (immutable user imports)
2. Derived artifacts (proxies, thumbnails, waveforms, temp segments)
3. Export outputs (final encoded files)

Source media is excluded from automatic eviction unless explicitly deleted by user action.

## Quota policy

- Hard limit: `2GB` combined derived artifacts + export cache budget.
- Soft threshold: `1.8GB` triggers proactive cleanup.
- Emergency policy: if storage write fails, force immediate LRU eviction cycle and retry once.

## LRU cache model

### Key

`artifactType + clipId + transformHash`

### Metadata index

- `key`
- `artifactId`
- `sizeBytes`
- `lastAccessTs`
- `pinned`
- `recomputeCostHint`
- `artifactType`

### Eviction order

1. Exclude pinned records.
2. Sort by `lastAccessTs` ascending.
3. Tie-break by low `recomputeCostHint`.
4. Evict until current usage falls below soft threshold.

## Platform implementation

- Mobile:
  - binary data in app sandbox directories,
  - metadata index in SQLite or file-backed index (`unsure` final selection).
- Web:
  - metadata and blob references in IndexedDB,
  - fetchable assets in CacheStorage where applicable.

## Consistency guarantees

- Index write is committed before file deletion acknowledgement.
- Every eviction event writes audit metadata to job journal.
- On app restart, index reconciles missing files and self-heals stale records.
