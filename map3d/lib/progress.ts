// Pure Progress_Record transitions, shared by the recorder and the Live Map UI.
// Results never contain `undefined` values, so they can be written to RTDB directly.
import { normalizeOrder } from './orders.ts';
import type { OrderItem, ProgressRecord, Stage } from './types.ts';

export const STAGES: readonly Stage[] = ['placed', 'preparing', 'ready', 'served'];

const STAGE_AT = {
  placed: 'placedAt',
  preparing: 'preparingAt',
  ready: 'readyAt',
  served: 'servedAt',
} as const satisfies Record<Stage, keyof ProgressRecord>;

export function isStage(v: unknown): v is Stage {
  return typeof v === 'string' && (STAGES as readonly string[]).includes(v);
}

/** Read a stored `liveMap/progress/{id}` value; null when missing or malformed. */
export function asProgress(id: string, v: unknown): ProgressRecord | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Partial<ProgressRecord>;
  if (!isStage(p.stage) || typeof p.table !== 'string' || typeof p.createdAt !== 'number') return null;
  // RTDB drops empty arrays and may return arrays as index-keyed objects.
  const rawItems: unknown[] = Array.isArray(p.items) ? p.items : p.items && typeof p.items === 'object' ? Object.values(p.items) : [];
  const items = rawItems
    .filter((i): i is OrderItem => typeof i === 'object' && i !== null)
    .map(i => ({ ...i, prefs: Array.isArray(i.prefs) ? i.prefs : [] }));
  return { ...(p as ProgressRecord), orderId: id, items, paid: p.paid === true };
}

/** Snapshot a raw `orders/{id}` record into a new Progress_Record at stage `placed`. */
export function createFrom(orderId: string, raw: unknown, now: number): ProgressRecord | null {
  if (!orderId) return null;
  const o = normalizeOrder(raw);
  if (!o) return null;
  return {
    orderId,
    orderNo: o.orderNo || orderId,
    table: o.table,
    total: o.total,
    createdAt: o.createdAt,
    items: o.items,
    stage: 'placed',
    placedAt: now,
    paid: false,
    updatedAt: now,
  };
}

/** Move to stage `s` and stamp its timestamp. Re-applying the current stage is a no-op. */
export function withStage(p: ProgressRecord, s: Stage, now: number): ProgressRecord {
  if (p.stage === s) return p;
  return { ...p, stage: s, [STAGE_AT[s]]: now, updatedAt: now };
}

/** Mark as paid. The first paidAt and billNo are kept when already paid. */
export function withPaid(p: ProgressRecord, billNo: string | undefined, now: number): ProgressRecord {
  if (p.paid) return p;
  const next: ProgressRecord = { ...p, paid: true, paidAt: now, updatedAt: now };
  if (billNo) next.billNo = billNo;
  return next;
}

/** Served and paid → the record can move to history (Req 8.7). */
export function isClosable(p: ProgressRecord): boolean {
  return p.stage === 'served' && p.paid;
}
