// Top_Bar counter calculations.
import { isClosable } from './progress.ts';
import type { BillRecord, ProgressRecord } from './types.ts';

/** Active orders = open Progress_Records (served + paid ones are about to close). */
export function openCount(orders: ProgressRecord[]): number {
  return orders.reduce((n, p) => (isClosable(p) ? n : n + 1), 0);
}

/** Local-midnight bounds of the day containing `now`. */
export function dayRange(now: number): { start: number; end: number } {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return { start, end };
}

/** "DD-MM-YYYY", the date format used by billHistory.js. */
export function billDate(now: number): string {
  const d = new Date(now);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

/** "YYYY-MM-DD", the key used by liveMap/history. */
export function historyDate(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Mean of readyAt − createdAt in minutes over records that reached ready today.
 * Pass active and today's history records; duplicates by orderId count once. Null when none qualify.
 */
export function avgPrepMinutes(records: ProgressRecord[], now: number): number | null {
  const { start, end } = dayRange(now);
  const seen = new Set<string>();
  let sum = 0;
  let n = 0;
  for (const p of records) {
    if (seen.has(p.orderId)) continue;
    seen.add(p.orderId);
    const r = p.readyAt;
    if (typeof r !== 'number' || r < start || r >= end || r < p.createdAt) continue;
    sum += r - p.createdAt;
    n++;
  }
  return n ? sum / n / 60000 : null;
}

/** Sum of today's bill amounts; null when the Bill_History_Store is unavailable. */
export function todaySales(bills: BillRecord[] | null, now: number): number | null {
  if (!bills) return null;
  const today = billDate(now);
  return bills.reduce((s, b) => (b.date === today && Number.isFinite(b.amount) ? s + b.amount : s), 0);
}
