import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffToEvents, MAX_EVENTS, PULSE_MS, pushEvents, updatePulses } from '../../map3d/lib/events.ts';
import type { ProgressRecord, Stage } from '../../map3d/lib/types.ts';

const order = (id: string, stage: Stage, extra: Partial<ProgressRecord> = {}): ProgressRecord => ({
  orderId: id, orderNo: `QR-X-${id}`, table: '2', total: 100, createdAt: 1000, items: [],
  stage, placedAt: 1000, paid: false, updatedAt: 1000, ...extra,
});

test('diffToEvents reports new, stage, paid and closed (Req 11.3)', () => {
  const prev = [order('a', 'placed'), order('b', 'ready'), order('c', 'served')];
  const next = [order('a', 'preparing'), order('b', 'ready', { paid: true, billNo: '42' }), order('d', 'placed')];
  const evs = diffToEvents(prev, next, 5000);
  const kinds = evs.map(e => `${e.kind}:${e.text}`);
  assert.deepEqual(kinds.sort(), [
    'closed:#c Closed', 'new:#d New order', 'paid:#b Paid · Bill #42', 'stage:#a Preparing',
  ].sort());
  assert.ok(evs.every(e => e.at === 5000 && e.table === '2'));
  assert.deepEqual(diffToEvents(next, next, 6000), []);
});

test('pushEvents keeps the newest 8, newest first', () => {
  let buf = pushEvents([], diffToEvents([], [order('1', 'placed')], 1));
  const many = Array.from({ length: 10 }, (_, i) => order(`n${i}`, 'placed'));
  buf = pushEvents(buf, diffToEvents([], many, 2));
  assert.equal(buf.length, MAX_EVENTS);
  assert.equal(buf[0].text, '#n9 New order');
});

test('updatePulses adds pulses for new orders and expires them after 1.5 s', () => {
  const added = diffToEvents([order('a', 'placed')], [order('a', 'preparing'), order('b', 'placed')], 1000);
  const pulses = updatePulses([], added, 1000);
  assert.deepEqual(pulses, [{ table: '2', at: 1000 }]);
  assert.equal(updatePulses(pulses, [], 1000 + PULSE_MS - 1).length, 1);
  assert.equal(updatePulses(pulses, [], 1000 + PULSE_MS).length, 0);
});
