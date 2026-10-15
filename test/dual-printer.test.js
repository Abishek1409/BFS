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

// Receipt alignment and emphasis

const { CUSTOMER_RECEIPT_COLS, PAPER_WIDTH_80MM, CMD } = require('../escpos-receipt');

// Splits ESC/POS bytes into text lines, flagging lines printed above normal size
function decodeLines(bytes) {
  const lines = [];
  let text = '';
  let enlarged = false;
  let size = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x1B) {
      i += bytes[i + 1] === 0x40 ? 1 : 2; // ESC @ has no parameter
    } else if (b === 0x1D) {
      if (bytes[i + 1] === 0x21) size = bytes[i + 2];
      i += 2;
    } else if (b === 0x0A) {
      lines.push({ text, enlarged });
      text = '';
      enlarged = false;
    } else {
      text += String.fromCharCode(b);
      if (size !== 0) enlarged = true;
    }
  }
  return lines;
}

const bytesOf = (...parts) => Buffer.from(parts.flat());

test('customer receipt columns stay within 48 characters and line up', () => {
  const bill = { ...completeBill, items: [{ name: 'Mango Shake', qty: 2, price: 1250, total: 2500 }], subtotal: 2500, grandTotal: 2500 };
  const lines = decodeLines(generateCustomerReceipt(bill));
  for (const line of lines.filter(l => !l.enlarged)) {
    assert.ok(line.text.length <= PAPER_WIDTH_80MM, `line too long: "${line.text}"`);
  }

  const header = lines.find(l => l.text.startsWith('ITEM')).text;
  const row = lines.find(l => l.text.startsWith('Mango Shake')).text;
  assert.equal(header.length, PAPER_WIDTH_80MM);
  assert.equal(row.length, PAPER_WIDTH_80MM);

  const { ITEM, QTY, PRICE } = CUSTOMER_RECEIPT_COLS;
  const qtyEnd = ITEM + QTY;
  const priceEnd = qtyEnd + PRICE;
  assert.ok(header.slice(0, qtyEnd).endsWith('QTY') && row.slice(0, qtyEnd).endsWith('2'));
  assert.ok(header.slice(0, priceEnd).endsWith('PRICE') && row.slice(0, priceEnd).endsWith('Rs.1250.00'));
  assert.ok(header.endsWith('TOTAL') && row.endsWith('Rs.2500.00'));

  const subtotal = lines.find(l => l.text.includes('SUBTOTAL')).text;
  assert.equal(subtotal.length, PAPER_WIDTH_80MM);
  assert.ok(subtotal.endsWith('Rs.2500.00'));
});

test('both documents emphasise the title initials and the bill number', () => {
  const boldStrike = [...CMD.BOLD_ON, ...CMD.DOUBLE_STRIKE_ON];
  const initials = { B: 0x42, F: 0x46, S: 0x53 };

  for (const generate of [generateCustomerReceipt, generateKitchenTicket]) {
    const doc = Buffer.from(generate(completeBill));

    for (const code of Object.values(initials)) {
      assert.ok(doc.includes(bytesOf(CMD.FONT_XLARGE, [code])), 'missing enlarged title initial');
    }
    assert.ok(doc.includes(bytesOf(boldStrike, [0x1D, 0x21, 0x22, initials.B])), 'title not bold + double-strike');
    assert.ok(doc.includes(bytesOf(boldStrike, CMD.FONT_LARGE, [...Buffer.from('Bill #B-1042')])), 'bill number not emphasised');

    const lines = decodeLines(doc);
    const dateLine = lines.find(l => l.text.startsWith('Date:'));
    assert.ok(dateLine && dateLine.text.length <= PAPER_WIDTH_80MM);
  }
});

// --- Direct-mode warning ---

function createCommContext(warnings, fetchImpl) {
  const context = vm.createContext({
    localStorage: { getItem: () => null, setItem: () => {} },
    console: { log() {}, warn() {}, error() {} },
    // Default: print server not running, other requests succeed
    fetch: fetchImpl || (async url => {
      if (url.includes('/print-to')) throw new TypeError('Failed to fetch');
      return { ok: true, json: async () => ({ success: true }) };
    }),
    showWarningToast: (...args) => warnings.push(args),
    AbortSignal
  });
  vm.runInContext(fs.readFileSync(require.resolve('../unified-printer-comm.js'), 'utf8'), context);
  return context;
}

test('direct printer address shows one warning without the IP, print server address shows none', async () => {
  const warnings = [];
  const context = createCommContext(warnings);

  vm.runInContext("printerConnections.printer1.type = 'wifi'; printerConnections.printer1.ip = '192.0.2.11'; printerConnections.printer1.port = 9100;", context);
  await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  assert.equal(warnings.length, 1);
  assert.ok(!warnings[0].join(' ').includes('192.0.2.11'));

  vm.runInContext("printerConnections.printer2.type = 'wifi'; printerConnections.printer2.ip = 'localhost'; printerConnections.printer2.port = 3000;", context);
  await vm.runInContext("sendToPosiflow('printer2', new Uint8Array([1]))", context);
  assert.equal(warnings.length, 1);
});

test('direct printer IP is relayed through the print server, so no HTTP headers reach the printer', async () => {
  const requests = [];
  const warnings = [];
  const context = createCommContext(warnings, async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ success: true }) };
  });
  vm.runInContext("printerConnections.printer1.type = 'wifi'; printerConnections.printer1.ip = '192.168.1.8'; printerConnections.printer1.port = 9100;", context);
  const result = await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  assert.equal(result.success, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://localhost:3000/print-to?ip=192.168.1.8&port=9100');
  assert.equal(warnings.length, 0);
});

test('direct fallback treats a timeout as delivered so the bill clears', async () => {
  const context = createCommContext([], async url => {
    if (url.includes('/print-to')) throw new TypeError('Failed to fetch');
    const err = new Error('signal timed out');
    err.name = 'TimeoutError';
    throw err;
  });
  vm.runInContext("printerConnections.printer1.type = 'wifi'; printerConnections.printer1.ip = '192.168.1.8'; printerConnections.printer1.port = 9100;", context);
  const result = await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  assert.equal(result.success, true);
});

test('print server reports a real printer failure', async () => {
  const context = createCommContext([], async () => ({ ok: false, status: 502, json: async () => ({ success: false, error: 'ECONNREFUSED' }) }));
  vm.runInContext("printerConnections.printer1.type = 'wifi'; printerConnections.printer1.ip = '192.168.1.8'; printerConnections.printer1.port = 9100;", context);
  const result = await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  assert.equal(result.success, false);
  assert.match(result.error, /ECONNREFUSED/);
});

test('/print-to relays to private LAN printers only', async () => {
  const sent = [];
  const baseUrl = await startTestServer({ send: async (printer, data) => { sent.push({ ip: printer.ip, port: printer.port, data: data.toString() }); } });
  const ok = await fetch(`${baseUrl}/print-to?ip=192.168.1.8&port=9100`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('bill') });
  assert.equal(ok.status, 200);
  assert.deepEqual(sent, [{ ip: '192.168.1.8', port: 9100, data: 'bill' }]);
  const blocked = await fetch(`${baseUrl}/print-to?ip=8.8.8.8&port=9100`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('x') });
  assert.equal(blocked.status, 400);
});

test('sendToPrinter resolves after flushing even if the printer keeps the socket open', async () => {
  const net = require('node:net');
  const { sendToPrinter } = require('../print-server');
  const received = [];
  const sockets = [];
  const fake = net.createServer({ allowHalfOpen: true }, socket => {
    sockets.push(socket);
    socket.on('data', d => received.push(d)); // never closes its side
  });
  await new Promise(r => fake.listen(0, '127.0.0.1', r));
  const start = Date.now();
  await sendToPrinter({ ip: '127.0.0.1', port: fake.address().port, name: 'Fake' }, Buffer.from('ESC'));
  assert.ok(Date.now() - start < 3000);
  await new Promise(r => setTimeout(r, 50));
  assert.equal(Buffer.concat(received).toString(), 'ESC');
  // The fake printer holds its half open, so close it from the test side
  sockets.forEach(s => s.destroy());
  await new Promise(r => fake.close(r));
});

test('falls back to POST /print?ip= when an older print server has no /print-to', async () => {
  const urls = [];
  const context = createCommContext([], async url => {
    urls.push(url);
    return url.includes('/print-to')
      ? { ok: false, status: 404, json: async () => ({}) }
      : { ok: true, status: 200, json: async () => ({ success: true }) };
  });
  vm.runInContext("printerConnections.printer1.type = 'wifi'; printerConnections.printer1.ip = '192.168.1.8'; printerConnections.printer1.port = 9100;", context);
  const result = await vm.runInContext("sendToPosiflow('printer1', new Uint8Array([1]))", context);
  assert.equal(result.success, true);
  assert.equal(urls[1], 'http://localhost:3000/print?ip=192.168.1.8&port=9100');
});

test('server accepts POST /print?ip= for a single LAN printer', async () => {
  const sent = [];
  const baseUrl = await startTestServer({ send: async printer => { sent.push(`${printer.ip}:${printer.port}`); } });
  const res = await fetch(`${baseUrl}/print?ip=192.168.1.9&port=9100`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.from('bill') });
  assert.equal(res.status, 200);
  assert.deepEqual(sent, ['192.168.1.9:9100']);
});
