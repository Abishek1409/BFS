import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTableStatus, STATUS_META, STATUS_ORDER } from '../../map3d/lib/status.ts';
import type { ProgressRecord, Stage, TableRecord } from '../../map3d/lib/types.ts';

const table = (occupied = false): TableRecord => ({ number: '3', label: 'Table 3', seats: 4, occupied });

const order = (id: string, stage: Stage, extra: Partial<ProgressRecord> = {}): ProgressRecord => ({
  orderId: id, orderNo: `QR-${id}`, table: '3', total: 100, createdAt: 1000, items: [],
  stage, placedAt: 1000, paid: false, updatedAt: 1000, ...extra,
});

test('free and occupied tables without orders', () => {
  assert.equal(deriveTableStatus(table(false), []).status, 'free');
  assert.equal(deriveTableStatus(table(true), []).status, 'occupied');
});

test('each stage maps to its Table_Status', () => {
  const cases: [Stage, string][] = [
    ['placed', 'order_placed'], ['preparing', 'preparing'], ['ready', 'ready_to_serve'], ['served', 'needs_bill'],
  ];
  for (const [stage, status] of cases) {
    assert.equal(deriveTableStatus(table(), [order('a', stage)]).status, status);
  }
});

test('paid before served keeps stage colour with paid badge', () => {
  const v = deriveTableStatus(table(), [order('a', 'preparing', { paid: true })]);
  assert.equal(v.status, 'preparing');
  assert.equal(v.paid, true);
});

test('served and paid order is ignored, table becomes free', () => {
  const v = deriveTableStatus(table(), [order('a', 'served', { paid: true })]);
  assert.equal(v.status, 'free');
  assert.equal(v.primary, undefined);
});

test('oldest order is primary, others counted as extra; other tables ignored', () => {
  const v = deriveTableStatus(table(), [
    order('new', 'placed', { createdAt: 3000 }),
    order('old', 'ready', { createdAt: 2000 }),
    order('other', 'placed', { table: '5' }),
  ]);
  assert.equal(v.primary?.orderId, 'old');
  assert.equal(v.status, 'ready_to_serve');
  assert.equal(v.extraOrders, 1);
});

test('six statuses have distinct colours', () => {
  const colours = STATUS_ORDER.map(s => STATUS_META[s].color);
  assert.equal(new Set(colours).size, 6);
});
