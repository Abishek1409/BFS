// Top_Bar counter calculations.
import { isClosable } from './progress.ts';
import type { BillRecord, ProgressRecord } from './types.ts';

const indiaDateParts = (timestamp: number): { year: number; month: number; day: number } => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp);
  return {
    year: Number(parts.find(p => p.type === 'year')?.value),
    month: Number(parts.find(p => p.type === 'month')?.value),
    day: Number(parts.find(p => p.type === 'day')?.value),
  };
};

/** Active orders = open Progress_Records (served + paid ones are about to close). */
export function openCount(orders: ProgressRecord[]): number {
  return orders.reduce((n, p) => (isClosable(p) ? n : n + 1), 0);
}

/** India-midnight bounds of the day containing `now`. */
export function dayRange(now: number): { start: number; end: number } {
  const { year, month, day } = indiaDateParts(now);
  const start = Date.UTC(year, month - 1, day) - 330 * 60 * 1000;
  const end = start + 24 * 60 * 60 * 1000;
  return { start, end };
}

/** "DD-MM-YYYY", the date format used by billHistory.js. */
export function billDate(now: number): string {
  const { year, month, day } = indiaDateParts(now);
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
}

/** "YYYY-MM-DD", the key used by liveMap/history. */
export function historyDate(now: number): string {
  const { year, month, day } = indiaDateParts(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
