const test = require('node:test');
const assert = require('node:assert');
const { MENU, sortMenu } = require('../menu-data.js');

test('items go lowest to highest price inside each category, category order kept', () => {
  const sorted = sortMenu(MENU);
  const catOrder = [...new Set(MENU.map(i => i.cat))];
  assert.deepEqual([...new Set(sorted.map(i => i.cat))], catOrder);
  catOrder.forEach(cat => {
    const prices = sorted.filter(i => i.cat === cat).map(i => i.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), cat);
  });
  assert.equal(sorted.length, MENU.length);
});

test('a newly added item lands in its price position, not at the end', () => {
  const items = [
    { id: 1, name: 'A', cat: 'Hot', price: 30 },
    { id: 2, name: 'B', cat: 'Cold', price: 80 },
    { id: 3, name: 'C', cat: 'Hot', price: 50 },
    { id: 4, name: 'New', cat: 'Hot', price: 10 },
    { id: 5, name: 'D', cat: 'Cold', price: 40 }
  ];
  assert.deepEqual(sortMenu(items).map(i => i.name), ['New', 'A', 'C', 'D', 'B']);
});

test('equal prices keep their existing order', () => {
  const items = [
    { name: 'X', cat: 'Fries', price: 60 },
    { name: 'Y', cat: 'Fries', price: 60 },
    { name: 'Z', cat: 'Fries', price: 20 }
  ];
  assert.deepEqual(sortMenu(items).map(i => i.name), ['Z', 'X', 'Y']);
});
