// Events_Feed and new-order pulses derived from snapshot diffs.
import { shortOrderNo } from './format.ts';
import type { MapEvent, ProgressRecord, Pulse, Stage } from './types.ts';

export const MAX_EVENTS = 8;
export const PULSE_MS = 1500;

const STAGE_TEXT: Record<Stage, string> = {
  placed: 'Order placed',
  preparing: 'Preparing',
  ready: 'Ready to serve',
  served: 'Served',
};

let seq = 0;
const nextId = (at: number) => `${at.toString(36)}-${(seq++).toString(36)}`;

function ev(kind: MapEvent['kind'], p: ProgressRecord, at: number, text: string): MapEvent {
  return { id: nextId(at), at, table: p.table, kind, text: `#${shortOrderNo(p.orderNo)} ${text}` };
}

/** Events from prev → next active orders (new, stage change, paid, closed/removed). */
export function diffToEvents(prev: ProgressRecord[], next: ProgressRecord[], now: number): MapEvent[] {
  const before = new Map(prev.map(p => [p.orderId, p]));
  const after = new Set<string>();
  const out: MapEvent[] = [];
  for (const p of next) {
    after.add(p.orderId);
    const old = before.get(p.orderId);
    if (!old) {
      out.push(ev('new', p, now, 'New order'));
      continue;
    }
    if (old.stage !== p.stage) out.push(ev('stage', p, now, STAGE_TEXT[p.stage]));
    if (!old.paid && p.paid) out.push(ev('paid', p, now, p.billNo ? `Paid · Bill #${p.billNo}` : 'Paid'));
  }
  for (const p of prev) if (!after.has(p.orderId)) out.push(ev('closed', p, now, 'Closed'));
  return out;
}

export function errorEvent(table: string, text: string, now: number): MapEvent {
  return { id: nextId(now), at: now, table, kind: 'error', text };
}

/** Prepend `added` (oldest → newest) to the newest-first buffer, keeping MAX_EVENTS. */
export function pushEvents(buffer: MapEvent[], added: MapEvent[]): MapEvent[] {
  if (!added.length) return buffer;
  return [...added].reverse().concat(buffer).slice(0, MAX_EVENTS);
}

/** Add pulses for new-order events and drop pulses older than PULSE_MS. */
export function updatePulses(pulses: Pulse[], added: MapEvent[], now: number): Pulse[] {
  const fresh = pulses.filter(p => now - p.at < PULSE_MS);
  for (const e of added) if (e.kind === 'new') fresh.push({ table: e.table, at: e.at });
  return fresh;
}
