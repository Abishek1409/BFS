// ProgressRecorder: the single writer for automatic Progress_Record transitions.
// Runs in every open billing tab. Every write is a transaction keyed on the current
// value, or an idempotent multi-path update, so several tabs reach the same end state.
// Reads `orders` and `orderStatus/{id}`; writes only under `liveMap` (Req 19.3).
import { historyDate } from './counters.ts';
import { LIVE_KEYS, PATHS, liveRef, runTxn } from './firebase.ts';
import type { Database, DataSnapshot, Reference, SnapshotCb } from './firebase.ts';
import { findTable } from './layout.ts';
import { isValidOrder } from './orders.ts';
import { asProgress, createFrom, isClosable, withPaid, withStage } from './progress.ts';
import type { ProgressRecord } from './types.ts';

export interface RecorderOptions { now?: () => number; }

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const log = (msg: string, err: unknown) => console.error('[live-map]', msg, err);

export function startRecorder(db: Database, opts: RecorderOptions = {}): () => void {
  const now = opts.now ?? Date.now;
  const subs: Array<() => void> = [];
  const paidSubs = new Map<string, () => void>();   // orderId → off()
  const closing = new Set<string>();
  let active = new Map<string, ProgressRecord>();
  let stopped = false;

  const listen = (ref: Reference, event: 'value' | 'child_added' | 'child_changed', cb: SnapshotCb) => {
    ref.on(event, cb, err => log(`listener ${event} failed`, err));
    return () => ref.off(event, cb);
  };

  /** True when the order was already closed today or on its creation day (prevents re-creation). */
  async function inHistory(id: string, createdAt: number): Promise<boolean> {
    const days = new Set([historyDate(now()), historyDate(createdAt)]);
    for (const d of days) {
      const snap = await db.ref(`${PATHS.history(d)}/${id}`).once('value');
      if (snap.exists()) return true;
    }
    return false;
  }

  /** `orders/{id}` added or changed: snapshot valid orders, apply the served signal. */
  async function onOrder(snap: DataSnapshot): Promise<void> {
    const id = snap.key;
    const raw = snap.val();
    if (!id || stopped || !isObj(raw)) return;
    const served = raw.status === 'served';
    const valid = isValidOrder(raw);
    if (!valid && !served) return;                      // Req 1.6: ignore invalid orders
    if (valid && !active.has(id) && await inHistory(id, raw.createdAt as number)) return;

    await runTxn(db, PATHS.progressItem(id), current => {
      const t = now();
      let p = current == null ? null : asProgress(id, current);
      if (current != null && !p) return undefined;      // malformed record: leave untouched
      if (!p) {
        // Stub records (served signal after removal) never create a record.
        p = valid ? createFrom(id, raw, t) : null;
        if (!p) return current;                         // keep null; retried if the server differs
      } else if (!served) {
        return undefined;                               // exists already, nothing to change
      }
      return served ? withStage(p, 'served', t) : p;
    });
  }

  /** `orderStatus/{id}` = billed → mark the Progress_Record as paid. */
  function watchPaid(id: string): void {
    if (paidSubs.has(id)) return;
    const ref = db.ref(PATHS.orderStatus(id));
    paidSubs.set(id, listen(ref, 'value', snap => {
      const v = snap.val();
      if (!isObj(v) || v.status !== 'billed') return;
      const billNo = typeof v.billNo === 'string' || typeof v.billNo === 'number' ? String(v.billNo) : undefined;
      runTxn(db, PATHS.progressItem(id), current => {
        if (current == null) return current;
        const p = asProgress(id, current);
        if (!p || p.paid) return undefined;
        return withPaid(p, billNo, now());
      }).catch(err => log(`paid update failed for ${id}`, err));
    }));
  }

  /** Served + paid → atomically move to history and free the table (Req 8.7). */
  function close(p: ProgressRecord): void {
    if (closing.has(p.orderId)) return;
    closing.add(p.orderId);
    const t = now();
    const { orderId, ...rest } = p;
    const updates: Record<string, unknown> = {
      [LIVE_KEYS.progressItem(orderId)]: null,
      [LIVE_KEYS.historyItem(historyDate(t), orderId)]: { ...rest, closedAt: t },
    };
    // Only seeded layout tables; unknown table numbers would create junk nodes.
    if (findTable(p.table)) updates[LIVE_KEYS.tableOccupied(p.table)] = false;
    liveRef(db, PATHS.live).update(updates)
      .catch(err => log(`close failed for ${orderId}`, err))
      .finally(() => closing.delete(orderId));
  }

  /** Active Progress_Records: keep one paid listener per record and close finished ones. */
  function onProgress(snap: DataSnapshot): void {
    if (stopped) return;
    const v = snap.val();
    const next = new Map<string, ProgressRecord>();
    if (isObj(v)) {
      for (const [id, raw] of Object.entries(v)) {
        const p = asProgress(id, raw);
        if (p) next.set(id, p);
      }
    }
    active = next;
    for (const [id, off] of paidSubs) {
      if (!next.has(id)) { off(); paidSubs.delete(id); }
    }
    for (const p of next.values()) {
      if (isClosable(p)) close(p);
      else if (!p.paid) watchPaid(p.orderId);
    }
  }

  try {
    const handle = (snap: DataSnapshot) => {
      onOrder(snap).catch(err => log(`order sync failed for ${snap.key}`, err));
    };
    const orders = db.ref(PATHS.orders);
    subs.push(listen(db.ref(PATHS.progress), 'value', onProgress));
    subs.push(listen(orders, 'child_added', handle));
    subs.push(listen(orders, 'child_changed', handle));
  } catch (err) {
    log('recorder failed to start', err);
  }

  return function stop(): void {
    stopped = true;
    for (const off of subs) off();
    for (const off of paidSubs.values()) off();
    subs.length = 0;
    paidSubs.clear();
  };
}
