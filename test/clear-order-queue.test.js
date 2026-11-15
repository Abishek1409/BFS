'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function extractFunction(name) {
  const start = appSource.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `async function ${name} exists`);
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

function createContext(options) {
  const removedPaths = [];
  const toasts = [];
  let rootRemoveAttempted = false;
  let persistedOrders = null;
  let loginPrompted = false;
  const button = { disabled: false, textContent: 'Clear Queue & QR Orders' };
  const ordersRef = {
    once() {
      if (options.readError) return Promise.reject(options.readError);
      return Promise.resolve({ val: () => options.orders || {} });
    },
    child(orderId) {
      return {
        remove() {
          removedPaths.push(orderId);
          if (options.failIds && options.failIds.includes(orderId)) {
            return Promise.reject(new Error('PERMISSION_DENIED'));
          }
          return Promise.resolve();
        }
      };
    },
    remove() {
      rootRemoveAttempted = true;
      return Promise.reject(new Error('Root removal must not be used'));
    }
  };
  const firebase = {
    apps: [{}],
    auth: () => ({ currentUser: options.user })
  };
  let context;
  context = {
    orderQueue: options.queue.slice(),
    ordersRef,
    window: {
      firebase,
      confirm: () => options.confirm !== false,
      ShopAuth: { showLogin() { loginPrompted = true; } }
    },
    firebase,
    document: { getElementById: () => button },
    showErrorToast: (title, message) => toasts.push({ type: 'error', title, message }),
    showSuccessToast: (title, message) => toasts.push({ type: 'success', title, message }),
    persistPendingManualOrders() {
      persistedOrders = context.orderQueue.filter(order => order.source !== 'qr');
    },
    renderQueue() {},
    console: { error() {} }
  };
  vm.createContext(context);
  vm.runInContext(extractFunction('clearOrderQueue'), context);
  return {
    context,
    removedPaths,
    toasts,
    button,
    get rootRemoveAttempted() { return rootRemoveAttempted; },
    get persistedOrders() { return persistedOrders; },
    get loginPrompted() { return loginPrompted; }
  };
}

test('clears queue and deletes each Firebase QR order individually', async () => {
  const state = createContext({
    user: { uid: 'cashier', isAnonymous: false },
    orders: { 'qr-1': { items: [] }, 'qr-2': { items: [] } },
    queue: [
      { id: 1, source: 'manual' },
      { id: 2, source: 'qr', serverId: 'qr-1' }
    ]
  });

  await vm.runInContext('clearOrderQueue()', state.context);

  assert.deepEqual(state.removedPaths.sort(), ['qr-1', 'qr-2']);
  assert.equal(state.rootRemoveAttempted, false);
  assert.equal(state.context.orderQueue.length, 0);
  assert.deepEqual(state.persistedOrders, []);
  assert.equal(state.toasts.at(-1).type, 'success');
});

test('keeps queue entries when Firebase rejects the delete request', async () => {
  const state = createContext({
    user: { uid: 'cashier', isAnonymous: false },
    orders: { 'qr-1': { items: [] } },
    readError: new Error('PERMISSION_DENIED'),
    queue: [{ id: 1, source: 'manual' }, { id: 2, source: 'qr', serverId: 'qr-1' }]
  });

  await vm.runInContext('clearOrderQueue()', state.context);

  assert.equal(state.context.orderQueue.length, 2);
  assert.equal(state.persistedOrders, null);
  assert.equal(state.toasts.at(-1).type, 'error');
  assert.match(state.toasts.at(-1).message, /PERMISSION_DENIED/);
});

test('preserves local queue orders when only some QR deletes are denied', async () => {
  const state = createContext({
    user: { uid: 'cashier', isAnonymous: false },
    orders: { 'qr-ok': { items: [] }, 'qr-denied': { items: [] } },
    failIds: ['qr-denied'],
    queue: [
      { id: 1, source: 'manual' },
      { id: 2, source: 'qr', serverId: 'qr-ok' },
      { id: 3, source: 'qr', serverId: 'qr-denied' }
    ]
  });

  await vm.runInContext('clearOrderQueue()', state.context);

  assert.deepEqual(state.removedPaths.sort(), ['qr-denied', 'qr-ok']);
  assert.deepEqual(
    state.context.orderQueue.map(order => order.id),
    [1, 3]
  );
  assert.equal(state.persistedOrders.length, 1);
  assert.equal(state.toasts.at(-1).title, 'Queue partially cleared');
});

test('requires a signed-in Firebase shop account before reading or deleting orders', async () => {
  const state = createContext({
    user: null,
    orders: { 'qr-1': { items: [] } },
    queue: [{ id: 2, source: 'qr', serverId: 'qr-1' }]
  });

  await vm.runInContext('clearOrderQueue()', state.context);

  assert.deepEqual(state.removedPaths, []);
  assert.equal(state.loginPrompted, true);
  assert.equal(state.context.orderQueue.length, 1);
});
