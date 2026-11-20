'use strict';

// Regression tests for the security review fixes:
// QR order prices come from the shop menu, customer text is escaped, and the
// local print server only serves the billing site and printer ports.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createApp } = require('../print-server');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `function ${name} exists`);
  let depth = 0, inString = false, quote = '', lineComment = false, blockComment = false;
  for (let i = appSource.indexOf('{', start); i < appSource.length; i++) {
    const ch = appSource[i], next = appSource[i + 1];
    if (lineComment) { if (ch === '\n') lineComment = false; continue; }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (inString) { if (ch === '\\') { i++; continue; } if (ch === quote) inString = false; continue; }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return appSource.slice(start, i + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function qrContext() {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(
    'var menuItems = [{ name: "Mango Juice", price: 60, emoji: "M" }, { name: "Black Tea", price: 10 }];\n' +
    'var orderQueue = [];\n' +
    // escMenu has a quote inside a regex that the simple extractor cannot skip, so take it whole
    appSource.slice(appSource.indexOf('function escMenu('), appSource.indexOf('\n}', appSource.indexOf('function escMenu(')) + 2) + '\n' +
    ['verifyQrItemPrice', 'addQrOrder'].map(extractFunction).join('\n'),
    context
  );
  return context;
}

test('QR order prices and totals come from the shop menu, not the customer', () => {
  const c = qrContext();
  c.addQrOrder({
    table: '4', total: 1, createdAt: 1,
    items: [
      { name: 'Mango Juice (Large)', baseName: 'Mango Juice', size: 'Large', qty: 2, price: 0, total: 0 },
      { name: 'Black Tea', baseName: 'Black Tea', qty: 1, price: 1, total: 1 }
    ]
  }, 'order-1');
  const row = c.orderQueue[0];
  assert.equal(row.items[0].price, 70);       // 60 + 10 for Large
  assert.equal(row.items[0].total, 140);
  assert.equal(row.items[1].price, 10);
  assert.equal(row.amount, 150);              // not the 1 the customer sent
  assert.equal(row.items[0].priceUnverified, false);
});

test('QR items that are not on the menu are flagged for the cashier', () => {
  const c = qrContext();
  c.addQrOrder({ table: '2', items: [{ name: 'Mystery', qty: 150, price: 5 }] }, 'order-2');
  const item = c.orderQueue[0].items[0];
  assert.equal(item.priceUnverified, true);
  assert.equal(item.qty, 99);                 // quantity is capped
});

test('customer text is escaped before it is placed in the page', () => {
  const c = qrContext();
  assert.equal(c.escMenu('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  for (const fn of ['renderBill', 'showToast', 'renderHistoryTable', 'drawPie']) {
    if (appSource.indexOf(`function ${fn}(`) === -1) continue;
    const body = extractFunction(fn);
    assert.doesNotMatch(body, /\$\{item\.name\}|\+ it\.name \+|\+ item\.name \+|\$\{title\}|\$\{message\}/,
      `${fn} inserts raw text`);
  }
});

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('print server refuses other websites and non-printer ports', async (t) => {
  const sent = [];
  const server = await listen(createApp({
    send: async (printer) => { sent.push(printer.port); },
    allowedOrigins: ['https://bfs-one.vercel.app']
  }));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (query, origin) => fetch(`${base}/print-to?${query}`, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/octet-stream' }, origin ? { Origin: origin } : {}),
    body: Buffer.from('bill')
  });

  assert.equal((await post('ip=192.168.1.8&port=9100', 'https://evil.example')).status, 403);
  assert.equal((await post('ip=192.168.1.1&port=80', 'https://bfs-one.vercel.app')).status, 400);
  assert.equal((await post('ip=192.168.1.8&port=9100', 'https://bfs-one.vercel.app')).status, 200);
  assert.equal((await post('ip=192.168.1.8&port=9100', 'http://localhost:5500')).status, 200);
  assert.deepEqual(sent, [9100, 9100]);
});
