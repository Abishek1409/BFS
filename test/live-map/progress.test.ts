import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrom, isClosable, withPaid, withStage } from '../../map3d/lib/progress.ts';

const raw = {
  orderNo: 'QR-LX2-K9F', table: 3, total: 120, createdAt: 1000, status: 'pending',
  items: [{ name: 'Mango Juice', qty: 2, price: 60, sugar: 'Less Sugar' }],
};

test('createFrom snapshots a valid order at stage placed', () => {
  const p = createFrom('id1', raw, 5000);
  assert.ok(p);
  assert.equal(p.table, '3');
  assert.equal(p.stage, 'placed');
  assert.equal(p.placedAt, 5000);
  assert.equal(p.paid, false);
  assert.deepEqual(p.items[0].prefs, ['Less Sugar']);
  assert.equal(p.items[0].total, 120);
});

test('createFrom rejects orders missing table or createdAt (Req 1.6)', () => {
  assert.equal(createFrom('id1', { ...raw, table: '' }, 0), null);
  assert.equal(createFrom('id1', { ...raw, createdAt: undefined }, 0), null);
  assert.equal(createFrom('id1', { status: 'served' }, 0), null);
});

test('withStage stamps the stage timestamp and is a no-op for the same stage', () => {
  const p = createFrom('id1', raw, 5000)!;
  const prep = withStage(p, 'preparing', 6000);
  assert.equal(prep.stage, 'preparing');
  assert.equal(prep.preparingAt, 6000);
  assert.equal(prep.updatedAt, 6000);
  assert.equal(withStage(prep, 'preparing', 7000), prep);
});

test('withPaid keeps the first paid timestamp and bill number', () => {
  const p = withPaid(createFrom('id1', raw, 5000)!, 'B12', 6000);
  assert.equal(p.paid, true);
  assert.equal(p.billNo, 'B12');
  assert.equal(withPaid(p, 'B99', 7000), p);
});

test('isClosable requires served and paid in either order (Req 8.7)', () => {
  const p = createFrom('id1', raw, 5000)!;
  assert.equal(isClosable(withStage(p, 'served', 6000)), false);
  assert.equal(isClosable(withPaid(p, 'B1', 6000)), false);
  assert.equal(isClosable(withPaid(withStage(p, 'served', 6000), 'B1', 7000)), true);
  assert.equal(isClosable(withStage(withPaid(p, 'B1', 6000), 'served', 7000)), true);
});
