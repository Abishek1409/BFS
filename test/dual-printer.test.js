const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { createServer } = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const { generateCustomerReceipt, generateKitchenTicket } = require('../escpos-receipt');
const { createApp } = require('../print-server');

const printerConfig = {
  printer1: { name: 'Counter', ip: '192.0.2.11', port: 9100 },
  printer2: { name: 'Kitchen', ip: '192.0.2.12', port: 9100 }
};
const printCalls = [];
const runningServers = [];

after(async () => {
  await Promise.all(runningServers.map(server => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  })));
});

function startTestServer(options = {}) {
  const app = createApp({ printers: printerConfig, ...options });
  const server = createServer(app);
  runningServers.push(server);
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

const completeBill = {
  billNo: 'B-1042',
  customerName: 'Asha Customer',
  date: new Date(2026, 9, 2, 14, 35),
  items: [{
    name: 'Mango Shake',
    qty: 2,
    price: 75,
    total: 150,
    ice: 'With Ice',
    sugar: 'Normal Sugar',
    size: 'Large',
    note: 'Less thick'
  }],
  subtotal: 150,
  grandTotal: 150
};

function receiptText(bytes) {
  return Buffer.from(bytes).toString('latin1');
}

test('customer receipt includes all populated bill and item fields', () => {
  const text = receiptText(generateCustomerReceipt(completeBill));
  for (const expected of ['B-1042', 'Asha Customer', '02-Oct-2026', '14:35', 'Mango Shake', 'Large', 'Less thick', 'Rs.75.00', 'Rs.150.00', 'GRAND TOTAL']) {
    assert.ok(text.includes(expected), `customer receipt missing ${expected}`);
  }
});

test('kitchen ticket retains the item, quantity, preferences, and no-price layout', () => {
  const text = receiptText(generateKitchenTicket(completeBill));
  for (const expected of ['B-1042', 'Asha Customer', 'Mango Shake', '2', 'Large', 'Less thick', 'PREF', 'Thank you!']) {
    assert.ok(text.includes(expected), `kitchen ticket missing ${expected}`);
  }
  assert.ok(!text.includes('Rs.75.00'));
  assert.ok(!text.includes('GRAND TOTAL'));
});

test('single-printer configurations can target either physical printer', async () => {
  printCalls.length = 0;
  const baseUrl = await startTestServer({ send: async (printer, data) => {
    printCalls.push({ name: printer.name, data: Buffer.from(data) });
  } });
  const response1 = await fetch(`${baseUrl}/print/printer1`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('customer') });
  const response2 = await fetch(`${baseUrl}/print/printer2`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('kitchen') });
  assert.equal(response1.status, 200);
  assert.equal(response2.status, 200);
  assert.deepEqual(printCalls.map(call => call.name), ['Counter', 'Kitchen']);
  assert.deepEqual(printCalls.map(call => call.data.toString()), ['customer', 'kitchen']);
});

test('legacy fan-out submits both jobs concurrently and reports one-printer failure', async () => {
  let active = 0;
  let maxActive = 0;
  const baseUrl = await startTestServer({ send: async printer => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 20));
    active -= 1;
    if (printer.name === 'Kitchen') throw new Error('paper out');
  } });
  const response = await fetch(`${baseUrl}/print`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('test') });
  const result = await response.json();
  assert.equal(response.status, 502);
  assert.equal(maxActive, 2);
  assert.equal(result.results.printer1.success, true);
  assert.equal(result.results.printer2.success, false);
  assert.match(result.results.printer2.error, /paper out/);
});

test('reports both failures and permits retrying only the failed printer', async () => {
  let p2Attempts = 0;
  const baseUrl = await startTestServer({ send: async (printer, data) => {
    if (printer.name === 'Counter') throw new Error('counter offline');
    p2Attempts += 1;
    if (p2Attempts === 1) throw new Error('kitchen offline');
    printCalls.push({ name: printer.name, data: Buffer.from(data) });
  } });

  const bothFailed = await fetch(`${baseUrl}/print`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('first') });
  assert.equal(bothFailed.status, 502);
  assert.equal((await bothFailed.json()).success, false);

  const retry = await fetch(`${baseUrl}/print/printer2`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('kitchen retry') });
  assert.equal(retry.status, 200);
  assert.deepEqual(printCalls.at(-1), { name: 'Kitchen', data: Buffer.from('kitchen retry') });
});

test('printer-specific connection check tests only the requested printer', async () => {
  const checked = [];
  const baseUrl = await startTestServer({ test: async printer => { checked.push(printer.name); } });
  const response = await fetch(`${baseUrl}/test/printer1`);
  assert.equal(response.status, 200);
  assert.deepEqual(checked, ['Counter']);
});

test('browser WiFi sender targets the selected printer route', async () => {
  const requests = [];
  const context = vm.createContext({
    localStorage: { getItem: () => null, setItem: () => {} },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ success: true }) };
    },
    AbortSignal
  });
  vm.runInContext(fs.readFileSync(require.resolve('../unified-printer-comm.js'), 'utf8'), context);
  vm.runInContext("printerConnections.printer2.type = 'wifi'; printerConnections.printer2.ip = 'localhost'; printerConnections.printer2.port = 3000;", context);
  await vm.runInContext("sendToPosiflow('printer2', new Uint8Array([1, 2, 3]))", context);
  assert.equal(requests[0].url, 'http://localhost:3000/print/printer2');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/octet-stream');
});