import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avgPrepMinutes, billDate, openCount, todaySales } from '../../map3d/lib/counters.ts';
import type { ProgressRecord, Stage } from '../../map3d/lib/types.ts';

const NOW = new Date(2026, 9, 11, 15, 0).getTime();
const MIN = 60000;

const order = (id: string, stage: Stage, extra: Partial<ProgressRecord> = {}): ProgressRecord => ({
  orderId: id, orderNo: `QR-${id}`, table: '1', total: 100, createdAt: NOW - 30 * MIN, items: [],
  stage, placedAt: NOW - 30 * MIN, paid: false, updatedAt: NOW, ...extra,
});

test('openCount excludes served + paid orders (Req 9.1)', () => {
  assert.equal(openCount([
    order('a', 'placed'), order('b', 'served'), order('c', 'served', { paid: true }),
  ]), 2);
});

test('avgPrepMinutes averages createdAt → readyAt for today, once per order (Req 9.2)', () => {
  const a = order('a', 'ready', { readyAt: NOW - 26 * MIN });                 // 4 min
  const b = order('b', 'served', { readyAt: NOW - 22 * MIN });                // 8 min
  const yesterday = order('c', 'ready', { createdAt: NOW - 25 * 60 * MIN, readyAt: NOW - 24 * 60 * MIN });
  assert.equal(avgPrepMinutes([a, b, a, yesterday, order('d', 'placed')], NOW), 6);
});

test('avgPrepMinutes returns null when nothing qualifies', () => {
  assert.equal(avgPrepMinutes([order('a', 'placed')], NOW), null);
});

test('todaySales sums only today and is null when the store is unavailable', () => {
  const today = billDate(NOW);
  assert.equal(today, '11-10-2026');
  assert.equal(todaySales([
    { billNo: '1', amount: 120, date: today },
    { billNo: '2', amount: 80, date: today },
    { billNo: '3', amount: 500, date: '10-10-2026' },
  ], NOW), 200);
  assert.equal(todaySales(null, NOW), null);
});
