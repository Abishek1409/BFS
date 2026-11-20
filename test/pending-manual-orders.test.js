'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `function ${name} exists`);
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = appSource.indexOf('{', start); i < appSource.length; i++) {
    const ch = appSource[i];
    const next = appSource[i + 1];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return appSource.slice(start, i + 1);
  }
  throw new Error(`Could not extract function ${name}`);
}

const queueFunctions = [
  'restorePendingManualOrders',
  'persistPendingManualOrders',
  'addToQueue',
  'setPayMethod',
  'completeOrder'
].map(extractFunction).join('\n');

function createQueueContext(storage) {
  const context = {
    safeGetStorage(key) { return storage.get(key) || null; },
    safeSetStorage(key, value) { storage.set(key, value); },
    renderQueue() {},
    setQrOrderStatus() {},
    document: {
      getElementById() {
        return { classList: { add() {} } };
      }
    },
    setTimeout(callback) { callback(); },
    console
  };
  vm.createContext(context);
  vm.runInContext(`var orderQueue = [];\n${queueFunctions}`, context);
  return context;
}

test('printed manual orders and payment choice survive a Billing page reload', () => {
  const storage = new Map();
  const firstPage = createQueueContext(storage);
  firstPage.addToQueue('100', 'Mira', 125, [{ name: 'Mango Juice', qty: 2 }], 1731580000000);
  const orderId = firstPage.orderQueue[0].id;
  firstPage.setPayMethod(orderId, 'gpay');

  const storedOrders = JSON.parse(storage.get('bfsPendingManualOrders'));
  assert.equal(storedOrders.length, 1);
  assert.equal(storedOrders[0].payMethod, 'gpay');
  assert.equal(storedOrders[0].source, 'manual');

  const nextPage = createQueueContext(storage);
  nextPage.restorePendingManualOrders();
  assert.equal(nextPage.orderQueue.length, 1);
  assert.equal(nextPage.orderQueue[0].billNo, '100');
  assert.equal(nextPage.orderQueue[0].payMethod, 'gpay');
  assert.equal(nextPage.orderQueue[0].items[0].name, 'Mango Juice');
});

test('completing a manual order removes it from persistent pending orders', () => {
  const storage = new Map();
  const page = createQueueContext(storage);
  page.addToQueue('101', '', 40, [{ name: 'Fresh Lime', qty: 1 }], 1731580000000);

  page.completeOrder(page.orderQueue[0].id);

  assert.equal(page.orderQueue.length, 0);
  assert.deepEqual(JSON.parse(storage.get('bfsPendingManualOrders')), []);
});

test('a printed QR order waiting for payment survives leaving and reopening the Billing page', () => {
  const storage = new Map();
  const firstPage = createQueueContext(storage);
  // Printed QR orders are removed from Firebase, so the device must keep them
  firstPage.orderQueue.push({
    id: 7, source: 'qr', serverId: 'remote-7', table: '5', orderNo: 'QR-7', billNo: '104',
    status: 'printed', amount: 90, items: [{ name: 'Mango Juice', qty: 1, total: 90 }], placedAt: 1731580000000
  });
  firstPage.persistPendingManualOrders();

  const nextPage = createQueueContext(storage);
  nextPage.restorePendingManualOrders();
  assert.equal(nextPage.orderQueue.length, 1);
  const restored = nextPage.orderQueue[0];
  assert.equal(restored.source, 'qr');
  assert.equal(restored.serverId, 'remote-7');
  assert.equal(restored.table, '5');
  assert.equal(restored.billNo, '104');

  nextPage.completeOrder(restored.id);
  assert.deepEqual(JSON.parse(storage.get('bfsPendingManualOrders')), []);
});

test('QR orders not billed yet are not copied into local storage (Firebase keeps them)', () => {
  const storage = new Map();
  const page = createQueueContext(storage);
  page.orderQueue.push({ id: 1, source: 'qr', serverId: 'remote-1' });
  page.persistPendingManualOrders();

  assert.deepEqual(JSON.parse(storage.get('bfsPendingManualOrders')), []);
});
