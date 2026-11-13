const test = require('node:test');
const assert = require('node:assert');
const { create } = require('../inventory.js');

function memStore() {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
}

test('addCategory adds an empty category and rejects duplicates', () => {
  const inv = create(memStore());
  inv.load([{ id: 1, name: 'Mango Juice', price: 50, cat: 'Juices' }]);
  assert.deepStrictEqual(inv.getCategories(), ['Juices']);

  assert.strictEqual(inv.addCategory('  Snacks ').ok, true);
  assert.deepStrictEqual(inv.getCategories(), ['Juices', 'Snacks']);
  assert.strictEqual(inv.addCategory('snacks').ok, false);
  assert.strictEqual(inv.addCategory('juices').ok, false);
  assert.strictEqual(inv.addCategory('').ok, false);
  assert.strictEqual(inv.addCategory('x'.repeat(31)).ok, false);
});

test('categories persist and items can move between them', () => {
  const store = memStore();
  const inv = create(store);
  inv.load([{ id: 1, name: 'Mango Juice', price: 50, cat: 'Juices' }]);
  inv.addCategory('Shakes');
  assert.strictEqual(inv.updateCategory(1, 'Shakes').ok, true);
  assert.strictEqual(inv.get(1).cat, 'Shakes');

  const again = create(store);
  again.load([]);
  assert.deepStrictEqual(again.getCategories(), ['Shakes']);
});
