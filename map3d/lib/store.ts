// LiveStore: framework-free merged state for the Live Map (HUD, Map_Scene, List_View).
// Reads `liveMap/progress`, `liveMap/tables`, `.info/connected` and today's history from
// Firebase, plus today's bills from the Bill_History_Store. Firebase callbacks are
// coalesced with queueMicrotask into one snapshot rebuild. Owner actions (stage,
// occupied) are applied optimistically and rolled back with an error event on failure.
// Writes go only under `liveMap` through runTxn (Req 19.3).
import { avgPrepMinutes, billDate, historyDate, openCount, todaySales } from './counters.ts';
import { diffToEvents, errorEvent, pushEvents, updatePulses, PULSE_MS } from './events.ts';
import { PATHS, runTxn } from './firebase.ts';
import type { Database, DataSnapshot, EventType, Reference, SnapshotCb } from './firebase.ts';
import { defaultTableRecords, findTable } from './layout.ts';
import { asProgress, isClosable, withStage } from './progress.ts';
import { deriveTableStatus } from './status.ts';
import type { BillRecord, LiveSnapshot, MapEvent, ProgressRecord, Pulse, Stage, TableRecord } from './types.ts';

export interface LiveStore {
  subscribe(cb: () => void): () => void;
  getSnapshot(): LiveSnapshot;
  select(table: string | null): void;
  setStage(orderId: string, s: Stage): Promise<void>;        // optimistic + rollback
  setOccupied(table: string, v: boolean): Promise<void>;     // optimistic + rollback
  dispose(): void;
}

export const BILL_SAVED_EVENT = 'bfs:bill-saved';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const log = (msg: string, err: unknown) => console.error('[live-map]', msg, err);

interface BillHistoryApi { getBillRecordsByDateRange(start: string, end: string): Promise<unknown[]>; }

function asBill(v: unknown): BillRecord | null {
  if (!isObj(v) || typeof v.date !== 'string' || typeof v.amount !== 'number' || !Number.isFinite(v.amount)) return null;
  return { billNo: String(v.billNo ?? ''), amount: v.amount, date: v.date };
}

/** Parse a `{ id: record }` node into Progress_Records, skipping malformed entries. */
function parseRecords(v: unknown): Map<string, ProgressRecord> {
  const out = new Map<string, ProgressRecord>();
  if (!isObj(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    const p = asProgress(id, raw);
    if (p) out.set(id, p);
  }
  return out;
}

/** `liveMap/tables` → always the 8 layout tables; built-in defaults when missing or empty (Req 18.3). */
function parseTables(v: unknown): TableRecord[] {
  const defaults = defaultTableRecords();
  if (!isObj(v) || Object.keys(v).length === 0) return defaults;
  // RTDB may return numeric keys as an array (index 0 empty).
  const node: Obj = Array.isArray(v) ? Object.fromEntries(v.map((x, i) => [String(i), x])) : v;
  return defaults.map(d => {
    const r = node[d.number];
    if (!isObj(r)) return d;
    return {
      number: d.number,
      label: typeof r.label === 'string' && r.label ? r.label : d.label,
      seats: typeof r.seats === 'number' && r.seats > 0 ? r.seats : d.seats,
      occupied: r.occupied === true,
    };
  });
}

export function createLiveStore(db: Database | null, now: () => number = Date.now): LiveStore {
  const listeners = new Set<() => void>();
  const subs: Array<() => void> = [];
  const today = now();

  // Server state
  let progress = new Map<string, ProgressRecord>();
  let tableRecords: TableRecord[] = defaultTableRecords();
  const history = new Map<string, ProgressRecord>();       // today's closed records
  let connected = false;
  let progressReady = db === null;
  let tablesReady = db === null;

  // Bills: keyed like billHistory.js recordId, so re-saves overwrite
  const bills = new Map<string, BillRecord>();
  let billsOk = false;

  // Optimistic overlays
  const stageOverlay = new Map<string, { stage: Stage; at: number }>();
  const occupiedOverlay = new Map<string, boolean>();

  let events: MapEvent[] = [];
  let pulses: Pulse[] = [];
  let selected: string | null = null;
  let pulseTimer: ReturnType<typeof setTimeout> | undefined;
  let scheduled = false;
  let disposed = false;
  let snapshot: LiveSnapshot = build();

  function build(): LiveSnapshot {
    const t = now();
    const orders: ProgressRecord[] = [];
    for (const p of progress.values()) {
      const o = stageOverlay.get(p.orderId);
      const eff = o ? withStage(p, o.stage, o.at) : p;
      if (!isClosable(eff)) orders.push(eff);
    }
    orders.sort((a, b) => a.createdAt - b.createdAt);
    const tables = tableRecords.map(r => {
      const occ = occupiedOverlay.get(r.number);
      return deriveTableStatus(occ === undefined ? r : { ...r, occupied: occ }, orders);
    });
    return {
      connected,
      ready: progressReady && tablesReady,
      orders,
      tables,
      counters: {
        open: openCount(orders),
        avgPrepMin: avgPrepMinutes([...orders, ...history.values()], t),
        todaySales: todaySales(billsOk ? [...bills.values()] : null, t),
      },
      events,
      pulses: pulses.filter(p => t - p.at < PULSE_MS),
      selected,
    };
  }

  /** Coalesce bursts of callbacks into one rebuild + notify. */
  function schedule(): void {
    if (scheduled || disposed) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (disposed) return;
      snapshot = build();
      for (const cb of [...listeners]) cb();
    });
  }

  function addEvents(added: MapEvent[]): void {
    if (!added.length) return;
    const t = now();
    events = pushEvents(events, added);
    pulses = updatePulses(pulses, added, t);
    // Rebuild once the oldest pulse expires, so pulses leave the snapshot on time.
    if (pulseTimer !== undefined) clearTimeout(pulseTimer);
    if (pulses.length) {
      const wait = Math.max(0, Math.min(...pulses.map(p => p.at + PULSE_MS - t)));
      pulseTimer = setTimeout(() => {
        pulseTimer = undefined;
        pulses = updatePulses(pulses, [], now());
        schedule();
      }, wait + 16);
    }
  }

  const tableOf = (orderId: string) => progress.get(orderId)?.table ?? '';
  const fail = (table: string, err: unknown) => {
    if (err) log(`write failed for table ${table}`, err);
    addEvents([errorEvent(table, `Couldn't update Table ${table || '?'}. Try again`, now())]);
    schedule();
  };

  function listen(ref: Reference, event: EventType, cb: SnapshotCb): void {
    ref.on(event, cb, err => log(`listener ${event} failed`, err));
    subs.push(() => ref.off(event, cb));
  }

  function onProgress(snap: DataSnapshot): void {
    const next = parseRecords(snap.val());
    const added = progressReady ? diffToEvents([...progress.values()], [...next.values()], now()) : [];
    // Records leaving `progress` were closed into today's history (avg prep keeps them).
    for (const [id, p] of progress) if (!next.has(id)) history.set(id, p);
    // Drop overlays the server has caught up with, or whose record is gone.
    for (const [id, o] of stageOverlay) {
      const p = next.get(id);
      if (!p || p.stage === o.stage) stageOverlay.delete(id);
    }
    progress = next;
    progressReady = true;
    addEvents(added);
    schedule();
  }

  function onTables(snap: DataSnapshot): void {
    tableRecords = parseTables(snap.val());
    for (const r of tableRecords) {
      if (occupiedOverlay.get(r.number) === r.occupied) occupiedOverlay.delete(r.number);
    }
    tablesReady = true;
    schedule();
  }

  // --- Firebase subscriptions (Req 15.1–15.3) ---
  if (db) {
    try {
      listen(db.ref(PATHS.progress), 'value', onProgress);
      listen(db.ref(PATHS.tables), 'value', onTables);
      listen(db.ref(PATHS.connected), 'value', snap => { connected = snap.val() === true; schedule(); });
      db.ref(PATHS.history(historyDate(today))).once('value').then(snap => {
        for (const [id, p] of parseRecords(snap.val())) if (!history.has(id)) history.set(id, p);
        schedule();
      }).catch(err => log('history read failed', err));
    } catch (err) {
      log('store subscriptions failed', err);
      progressReady = tablesReady = true;
    }
  }

  // --- Bill_History_Store (Req 9.3, 9.4) ---
  const billKey = (b: BillRecord) => `${b.date}_${b.billNo}`;
  const onBillSaved = (e: Event) => {
    const b = asBill((e as CustomEvent<unknown>).detail);
    if (!b) return;
    bills.set(billKey(b), b);
    schedule();
  };
  const win = globalThis as { BillHistory?: BillHistoryApi; addEventListener?: Window['addEventListener']; removeEventListener?: Window['removeEventListener'] };
  win.addEventListener?.(BILL_SAVED_EVENT, onBillSaved);
  subs.push(() => win.removeEventListener?.(BILL_SAVED_EVENT, onBillSaved));
  try {
    const day = billDate(today);
    const api = win.BillHistory;
    if (api) {
      api.getBillRecordsByDateRange(day, day).then(list => {
        for (const raw of list) {
          const b = asBill(raw);
          if (b && !bills.has(billKey(b))) bills.set(billKey(b), b);
        }
        billsOk = true;
        schedule();
      }).catch(err => log('bill history unavailable', err));
    }
  } catch (err) {
    log('bill history unavailable', err);
  }

  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },

    getSnapshot: () => snapshot,

    select(table) {
      if (selected === table) return;
      selected = table;
      schedule();
    },

    async setStage(orderId, s) {
      const table = tableOf(orderId);
      const current = progress.get(orderId);
      if (!db || !current) return fail(table, null);
      const prev = stageOverlay.get(orderId);
      stageOverlay.set(orderId, { stage: s, at: now() });
      schedule();
      try {
        const res = await runTxn(db, PATHS.progressItem(orderId), raw => {
          if (raw == null) return raw;                 // closed meanwhile: nothing to update
          const p = asProgress(orderId, raw);
          return p ? withStage(p, s, now()) : undefined;
        });
        if (!res.committed) throw new Error('stage transaction aborted');
        // Overlay is cleared by the next progress value; drop it now if the record is gone.
        if (!progress.has(orderId)) stageOverlay.delete(orderId);
        schedule();
      } catch (err) {
        // Roll back to the state before this write (Req 8.4).
        if (stageOverlay.get(orderId)?.stage === s) {
          if (prev) stageOverlay.set(orderId, prev);
          else stageOverlay.delete(orderId);
        }
        fail(table, err);
      }
    },

    async setOccupied(table, v) {
      const slot = findTable(table);
      if (!db || !slot) return fail(table, null);
      const prev = occupiedOverlay.get(table);
      occupiedOverlay.set(table, v);
      schedule();
      try {
        await runTxn(db, PATHS.table(table), raw => {
          const base = isObj(raw) ? raw : { number: slot.number, label: slot.label, seats: slot.seats };
          return { ...base, occupied: v };
        });
        schedule();
      } catch (err) {
        if (occupiedOverlay.get(table) === v) {
          if (prev === undefined) occupiedOverlay.delete(table);
          else occupiedOverlay.set(table, prev);
        }
        fail(table, err);
      }
    },

    dispose() {
      disposed = true;
      if (pulseTimer !== undefined) clearTimeout(pulseTimer);
      for (const off of subs) off();
      subs.length = 0;
      listeners.clear();
    },
  };
}
