/**
 * Clip storage: IndexedDB + 2GB cap, oldest-first delete (Module 2).
 * Temporary buffer folder simulated via object store prefix `temp:`.
 */

import { logError, logInfo } from '../debug/debugLog';

const DB_NAME = 'reelcreator-clips';
const DB_VER = 1;
const STORE = 'clips';
const META = 'meta';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export type StoredClip = {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
  /** Approximate byte size */
  size: number;
  durationSec?: number;
  isTemp?: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META);
      }
    };
  });
}

async function getTotalUsedBytes(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const rows = req.result as StoredClip[];
      const sum = rows.reduce((a, r) => a + (r.size || 0), 0);
      resolve(sum);
    };
  });
}

/** Delete oldest non-temp clips until under budget. */
async function enforceQuota(db: IDBDatabase): Promise<void> {
  const used = await getTotalUsedBytes(db);
  if (used <= MAX_BYTES) return;

  const all = await new Promise<StoredClip[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as StoredClip[]);
  });

  const nonTemp = all.filter((c) => !c.isTemp && !c.id.startsWith('temp:'));
  nonTemp.sort((a, b) => a.createdAt - b.createdAt);

  let freed = 0;
  const targets: string[] = [];
  for (const c of nonTemp) {
    if (used - freed <= MAX_BYTES * 0.95) break;
    targets.push(c.id);
    freed += c.size;
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    targets.forEach((id) => st.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  logInfo('Storage quota: auto-deleted oldest clips', { deleted: targets.length });
}

export async function saveClip(clip: StoredClip): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(clip);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await enforceQuota(db);
}

export async function listClips(): Promise<StoredClip[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as StoredClip[]);
  });
}

export async function deleteClip(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Large upload processing buffer (temporary blobs). */
export async function saveTempBuffer(id: string, blob: Blob): Promise<void> {
  const clip: StoredClip = {
    id: `temp:${id}`,
    blob,
    name: `temp-${id}`,
    createdAt: Date.now(),
    size: blob.size,
    isTemp: true,
  };
  await saveClip(clip);
}

export async function getTempBuffer(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(`temp:${id}`);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const row = req.result as StoredClip | undefined;
      resolve(row?.blob ?? null);
    };
  });
}

export async function clearTempBuffers(): Promise<void> {
  const all = await listClips();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    all.filter((c) => c.isTemp || c.id.startsWith('temp:')).forEach((c) => st.delete(c.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Browser storage estimate (best effort). */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est) return null;
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  } catch (e) {
    logError('storage.estimate failed', e);
    return null;
  }
}

export { MAX_BYTES };
