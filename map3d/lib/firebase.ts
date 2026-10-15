// Thin typed wrapper over the Firebase compat SDK app that index.html initialises.
// Only the API surface the Live Map uses is typed. Writes go through `liveRef`,
// which only accepts paths under `liveMap` (Req 19.3).

export interface DataSnapshot {
  readonly key: string | null;
  val(): unknown;
  exists(): boolean;
}

export type EventType = 'value' | 'child_added' | 'child_changed' | 'child_removed';
export type SnapshotCb = (snap: DataSnapshot) => void;

export interface Reference {
  readonly key: string | null;
  on(event: EventType, cb: SnapshotCb, cancel?: (err: Error) => void): SnapshotCb;
  off(event?: EventType, cb?: SnapshotCb): void;
  once(event: 'value'): Promise<DataSnapshot>;
  set(value: unknown): Promise<void>;
  update(values: Record<string, unknown>): Promise<void>;
  remove(): Promise<void>;
  transaction(
    update: (current: unknown) => unknown,
    onComplete?: (err: Error | null, committed: boolean, snap: DataSnapshot | null) => void,
    applyLocally?: boolean,
  ): Promise<unknown>;
}

export interface Database { ref(path?: string): Reference; }

interface FirebaseCompat { apps?: unknown[]; database(): Database; }

const LIVE = 'liveMap';

export const PATHS = {
  orders: 'orders',
  order: (id: string) => `orders/${id}`,
  orderStatus: (id: string) => `orderStatus/${id}`,
  connected: '.info/connected',
  live: LIVE,
  progress: `${LIVE}/progress`,
  progressItem: (id: string) => `${LIVE}/progress/${id}`,
  tables: `${LIVE}/tables`,
  table: (n: string) => `${LIVE}/tables/${n}`,
  history: (date: string) => `${LIVE}/history/${date}`,
} as const;

/** Paths relative to `liveMap`, for atomic multi-path updates on `liveRef(db, PATHS.live)`. */
export const LIVE_KEYS = {
  progressItem: (id: string) => `progress/${id}`,
  historyItem: (date: string, id: string) => `history/${date}/${id}`,
  tableOccupied: (n: string) => `tables/${n}/occupied`,
} as const;

/** The billing page's database, or null when Firebase is not configured (offline mode). */
export function getDb(): Database | null {
  try {
    const w = globalThis as { firebaseConfig?: unknown; firebase?: FirebaseCompat };
    if (!w.firebaseConfig || !w.firebase?.apps?.length) return null;
    return w.firebase.database();
  } catch (err) {
    console.error('[live-map] Firebase unavailable', err);
    return null;
  }
}

/** Reference for writing; rejects any path outside `liveMap`. */
export function liveRef(db: Database, path: string): Reference {
  if (path !== LIVE && !path.startsWith(`${LIVE}/`)) {
    throw new Error(`[live-map] write outside ${LIVE}: ${path}`);
  }
  return db.ref(path);
}

export interface TxnResult { committed: boolean; value: unknown; }

/**
 * Promise wrapper over `transaction` (server-confirmed, not applied locally first).
 * Returning `undefined` from `update` aborts. Return the received `null` instead of
 * aborting when unsure, so a stale cache gets retried with the server value.
 */
export function runTxn(db: Database, path: string, update: (current: unknown) => unknown): Promise<TxnResult> {
  return new Promise((resolve, reject) => {
    liveRef(db, path).transaction(update, (err, committed, snap) => {
      if (err) reject(err);
      else resolve({ committed, value: snap ? snap.val() : null });
    }, false).catch(() => { /* reported via onComplete */ });
  });
}
