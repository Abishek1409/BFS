'use strict';

/*
 * Preservation Property Tests — Property 2: Preservation
 *
 * Non-Chime Alert Behavior Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests capture the EXISTING (baseline) non-chime alert behaviour of the
 * UNFIXED `notifyNewQrOrder` and surrounding code. They are EXPECTED TO PASS on
 * unfixed code, establishing the baseline that the later fix must NOT regress.
 *
 * The fix only touches `playOrderChime` (the chime sound). Everything else —
 * the toast content/buttons, document title flashing, the system Notification,
 * the AudioContext unlock-on-first-gesture flow, and the absence of any sound
 * when no QR order arrives — must stay byte-for-byte identical.
 *
 * Approach (same as task 1): extract the relevant source from the real app.js
 * and evaluate it inside a vm sandbox equipped with stubbed browser APIs
 * (fake DOM, fake AudioContext, fake Notification, fake timers) so behaviour is
 * observed without a real browser. `showToast` is replaced with a spy because
 * its real body uses nested template literals that resist brace-matched
 * extraction; the spy records the exact options object `notifyNewQrOrder`
 * builds, which is precisely the toast content we must preserve.
 *
 * Lightweight property-based testing: a seeded PRNG generates many varied
 * inputs (order shapes, tab visibility, notification permission, audio state)
 * and each generated case asserts the preservation property holds, giving a
 * strong guarantee across the input domain.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Read the actual UNFIXED app.js source — we test the real code, not a copy.
const APP_PATH = path.join(__dirname, '..', 'app.js');
const appSource = fs.readFileSync(APP_PATH, 'utf8');

/* ===========================================================================
 * Source extraction
 *
 * escapeQueueText: small ES5 helper used by notifyNewQrOrder to HTML-escape the
 *   table number and item names in the toast. Extracted via brace matching.
 *
 * Block C: the contiguous "QR order alert" block from `var orderChimeCtx` up
 *   to (but not including) `function handleOrderSyncError`. It contains the
 *   state vars, notifyNewQrOrder, flashTitle, stopFlashTitle, the top-level
 *   visibilitychange listener registration, playOrderChime, resumeOrderAudio,
 *   unlockOrderAlerts, and the top-level click/keydown/touchstart listener
 *   registration. Slicing the contiguous block keeps all the top-level wiring
 *   intact. The block uses only es5 string concatenation (no nested template
 *   literals), so simple string slicing is safe.
 * ========================================================================= */

/**
 * Extract a top-level function body from source by name using brace matching
 * that is aware of strings, line comments and block comments (same algorithm
 * as the task 1 exploration tests).
 */
function extractFunction(source, name) {
  const startMarker = `function ${name}(`;
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Function "${name}" not found in app.js source`);
  }
  let i = source.indexOf('{', start);
  if (i === -1) {
    throw new Error(`Could not find opening brace for "${name}"`);
  }
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  for (; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
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
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not find end of function "${name}"`);
}

const escapeQueueTextSrc = extractFunction(appSource, 'escapeQueueText');

const blockCStart = appSource.indexOf('var orderChimeCtx = null;');
const blockCEnd = appSource.indexOf('function handleOrderSyncError');
if (blockCStart === -1 || blockCEnd === -1 || blockCEnd <= blockCStart) {
  throw new Error('Could not locate the QR order alert block (Block C) in app.js');
}
const blockCSrc = appSource.slice(blockCStart, blockCEnd);

/* ===========================================================================
 * Seeded PRNG + input generators (lightweight property-based testing)
 * ========================================================================= */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randInt(rng, n) { return Math.floor(rng() * n); }
function pick(rng, arr) { return arr[randInt(rng, arr.length)]; }

/** Generate a QR order with widely varied shapes (missing fields, edge values). */
function genOrder(rng) {
  if (rng() < 0.1) return null; // totally missing order (real edge: snapshot.val() can be null)
  const order = {};
  const tableOptions = [undefined, null, 5, '5', 'Table 7', 'A-1', 0, '<b>x</b>', 'Café', 12.5];
  order.table = pick(rng, tableOptions);
  if (rng() < 0.15) delete order.table;
  const itemCount = randInt(rng, 6); // 0..5 items
  const nameOptions = [undefined, 'Coffee', 'Tea', 'Burger', '', 'Noodles', 'Pizza', 'Fresh Lime', 'x<y>'];
  const qtyOptions = [undefined, 1, 2, 0, 3, '2', 5];
  order.items = [];
  for (let i = 0; i < itemCount; i++) {
    order.items.push({
      name: pick(rng, nameOptions),
      qty: pick(rng, qtyOptions),
    });
  }
  if (rng() < 0.2) delete order.items;
  // Randomly populate total / amount / grandTotal (or none)
  const totalFields = ['total', 'amount', 'grandTotal'];
  const fieldCount = randInt(rng, 4); // 0..3
  for (let i = 0; i < fieldCount; i++) {
    const f = pick(rng, totalFields);
    order[f] = rng() < 0.3 ? 0 : Math.floor(rng() * 1000) / 10;
  }
  return order;
}

/* ===========================================================================
 * Browser API stubs
 * ========================================================================= */

/**
 * Create a fake DOM element that mirrors enough of a real element for
 * escapeQueueText (set textContent -> read escaped innerHTML) and for any
 * incidental DOM use. The innerHTML getter HTML-encodes textContent exactly as
 * a browser <div> does when innerHTML has not been explicitly set.
 */
function createFakeElement(tag) {
  let _innerHTML = null; // null => not explicitly set; mirror browser text path
  let _textContent = '';
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    className: '',
    get innerHTML() {
      if (_innerHTML !== null) return _innerHTML;
      return String(_textContent)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },
    set innerHTML(v) { _innerHTML = String(v); },
    get textContent() { return _textContent; },
    set textContent(v) { _textContent = (v == null ? '' : String(v)); },
    children: [],
    style: {},
    classList: {
      _set: new Set(),
      toggle(c, f) {
        if (f === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); }
        else { f ? this._set.add(c) : this._set.delete(c); }
      },
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    appendChild(c) { el.children.push(c); c.parentNode = el; return c; },
    removeChild(c) { el.children = el.children.filter(x => x !== c); c.parentNode = null; return c; },
    setAttribute() {}, getAttribute() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {},
    onclick: null, parentNode: null,
  };
  return el;
}

/** Fake document capturing event listeners, title, hidden, and element creation. */
function createFakeDocument(initial) {
  initial = initial || {};
  let _title = initial.title != null ? String(initial.title) : 'BFS POS';
  let _hidden = !!initial.hidden;
  const listeners = {}; // type -> [{handler, capture}]
  const addCalls = [];
  const removeCalls = [];
  const doc = {
    get title() { return _title; },
    set title(v) { _title = String(v); },
    get hidden() { return _hidden; },
    set hidden(v) { _hidden = !!v; },
    createElement(tag) { return createFakeElement(tag); },
    getElementById() { return null; },
    addEventListener(type, handler, capture) {
      addCalls.push({ type, handler, capture: !!capture });
      (listeners[type] = listeners[type] || []).push({ handler, capture: !!capture });
    },
    removeEventListener(type, handler, capture) {
      removeCalls.push({ type, handler, capture: !!capture });
      if (listeners[type]) {
        const idx = listeners[type].findIndex(l => l.handler === handler && l.capture === !!capture);
        if (idx >= 0) listeners[type].splice(idx, 1);
      }
    },
    _setHidden(v) { _hidden = !!v; },
    _dispatch(type) { (listeners[type] || []).slice().forEach(l => l.handler()); },
    _hasListener(type) { return (listeners[type] || []).length > 0; },
    _listeners: listeners,
    _addCalls: addCalls,
    _removeCalls: removeCalls,
  };
  return doc;
}

/** Fake timers (setInterval/setTimeout) that record callbacks for manual ticking. */
function createFakeTimers() {
  const intervals = [];
  const timeouts = [];
  let nextId = 1;
  return {
    setInterval(cb) { const id = nextId++; intervals.push({ id, cb }); return id; },
    clearInterval(id) { const i = intervals.findIndex(x => x.id === id); if (i >= 0) intervals.splice(i, 1); },
    setTimeout(cb) { const id = nextId++; timeouts.push({ id, cb }); return id; },
    clearTimeout(id) { const i = timeouts.findIndex(x => x.id === id); if (i >= 0) timeouts.splice(i, 1); },
    _tickIntervals() { intervals.slice().forEach(x => x.cb()); },
    _tickTimeouts() { timeouts.slice().forEach(x => x.cb()); timeouts.length = 0; },
    _intervalCount() { return intervals.length; },
    _timeoutCount() { return timeouts.length; },
  };
}

/**
 * Fake AudioContext constructor. `new AC()` returns a context whose resume()
 * resolves (success) or rejects (blocked). Every oscillator created by every
 * instance is recorded in the shared `_allOscillators` array so silence
 * properties can be asserted.
 */
function createFakeAudioContextCtor(opts) {
  opts = opts || {};
  const allOscillators = [];
  function AC() {
    const ctx = {
      state: 'suspended',
      currentTime: 100,
      destination: { __dest: true },
      resume() {
        if (opts.resumeSucceeds === false) return Promise.reject(new Error('blocked'));
        ctx.state = 'running';
        return Promise.resolve();
      },
      createOscillator() {
        const o = {
          type: null, frequency: { value: 0 },
          startTime: null, stopTime: null, connectedTo: null,
          connect(t) { o.connectedTo = t; return t; },
          start(t) { o.startTime = t; },
          stop(t) { o.stopTime = t; },
        };
        allOscillators.push(o);
        return o;
      },
      createGain() {
        const g = {
          gain: {
            events: [],
            setValueAtTime(v, t) { g.gain.events.push({ op: 'set', v, t }); },
            exponentialRampToValueAtTime(v, t) { g.gain.events.push({ op: 'ramp', v, t }); },
          },
          connectedTo: null,
          connect(t) { g.connectedTo = t; return t; },
        };
        return g;
      },
    };
    return ctx;
  }
  AC._allOscillators = allOscillators;
  return AC;
}

/** A minimal "running" AudioContext for tests that only need a synchronous chime path. */
function makeRunningCtx() {
  const oscs = [];
  return {
    state: 'running',
    currentTime: 100,
    destination: {},
    createOscillator() {
      const o = { type: null, frequency: { value: 0 }, start() {}, stop() {}, connect(t) { return t; } };
      oscs.push(o);
      return o;
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect(t) { return t; } };
    },
  };
}

/** Fake Notification constructor that records every notification created. */
function createFakeNotification(opts) {
  opts = opts || {};
  const calls = [];
  function Notification(title, options) {
    const inst = { onclick: null, close() {} };
    calls.push({ title, options: options || {}, instance: inst });
    return inst;
  }
  Notification.permission = opts.permission != null ? opts.permission : 'default';
  let rpCalls = 0;
  Notification.requestPermission = function () { rpCalls++; return Promise.resolve(Notification.permission); };
  Notification._calls = calls;
  Notification._requestPermissionCalls = () => rpCalls;
  Notification._setPermission = function (p) { Notification.permission = p; };
  return Notification;
}

/**
 * Build a fresh vm sandbox holding the alert block + escapeQueueText, with
 * stubbed browser APIs. Returns handles to the fakes/spies so tests can assert.
 */
function setupSandbox(opts) {
  opts = opts || {};
  const doc = createFakeDocument({ title: opts.title || 'BFS POS', hidden: !!opts.hidden });
  const timers = createFakeTimers();
  const AC = createFakeAudioContextCtor({ resumeSucceeds: opts.resumeSucceeds });
  const Notification = createFakeNotification({ permission: opts.permission != null ? opts.permission : 'default' });
  const windowObj = { AudioContext: AC, webkitAudioContext: AC, Notification: Notification, focus() {} };
  if (opts.noNotification) { delete windowObj.Notification; }

  const showToastCalls = [];
  const showToastSpy = function (options) { showToastCalls.push(options); };

  const sandbox = {
    // browser globals
    document: doc,
    window: windowObj,
    Notification: opts.noNotification ? undefined : Notification,
    console: console,
    Promise: Promise,
    // timer stubs (sandbox code uses these)
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
    // es built-ins (explicitly provided for determinism)
    Math: Math, Number: Number, String: String, Array: Array, Object: Object, JSON: JSON, Date: Date,
    // showToast is spied (real body resists extraction due to nested templates)
    showToast: showToastSpy,
    // loadQrOrder is referenced inside a toast action closure but never invoked
    // during these tests; provide a stub so the closure is safe.
    loadQrOrder: function () {},
  };

  vm.createContext(sandbox);
  // Evaluate escapeQueueText first (defines a global the block can call), then
  // the alert block (defines notifyNewQrOrder, flashTitle, etc. and runs the
  // top-level listener registrations).
  vm.runInContext(escapeQueueTextSrc + '\n' + blockCSrc, sandbox);

  return {
    sandbox, doc, timers, AC, Notification, windowObj,
    showToastCalls,
    escapeQueueText: sandbox.escapeQueueText,
    allOscillators: AC._allOscillators,
  };
}

/** Flush the real Node microtask queue (for async unlock-flow tests). */
function flushMicrotasks() { return new Promise(r => setTimeout(r, 0)); }

/* ===========================================================================
 * Expected-value helpers (replicate notifyNewQrOrder's content logic exactly
 * so assertions encode the precise baseline behaviour to preserve).
 * ========================================================================= */

function computeTable(order) {
  return order && order.table != null ? order.table : '?';
}

function expectedToastOptions(env, order, serverId) {
  const escape = env.escapeQueueText;
  const table = computeTable(order);
  const items = (order && order.items) || [];
  const summary = items.slice(0, 3).map(function (it) {
    return escape((it.name || 'Item') + ' x' + (Number(it.qty) || 1));
  }).join(', ') + (items.length > 3 ? ' +' + (items.length - 3) + ' more' : '');
  const total = Number(order && (order.total || order.amount || order.grandTotal)) || 0;
  const soundLocked = !env.sandbox.orderChimeCtx || env.sandbox.orderChimeCtx.state !== 'running';
  const title = '🔔 New order · Table ' + escape(table);
  const message = summary + (total ? ' · ₹' + total.toFixed(2) : '') +
    (soundLocked ? '<br><small>Click anywhere on the page once to enable the alert sound.</small>' : '');
  return {
    type: 'info',
    title: title,
    message: message,
    duration: 0,
    actions: [
      { label: 'Load & Print', primary: true },
      { label: 'Later' },
    ],
  };
}

function expectedNotification(order, serverId) {
  const table = computeTable(order);
  const items = (order && order.items) || [];
  return {
    title: 'New order · Table ' + table,
    body: items.map(function (it) { return it.name + ' x' + (it.qty || 1); }).join(', '),
    tag: 'qr-order-' + serverId,
  };
}

/* ===========================================================================
 * Test 2.1 — No-Order Silence Preservation  (validates 3.1)
 *
 * Property: for any sequence of NON-QR-order events (page load, navigation /
 * visibility changes, a click/keydown/touchstart that unlocks audio, flashing
 * a non-order title), no OscillatorNode is ever created. The chime only fires
 * from playOrderChime, which is only reached via notifyNewQrOrder or the unlock
 * path when orderChimePending is true; without an order the flag stays false.
 * ========================================================================= */
test('2.1 — No-Order Silence Preservation: no oscillator created without a QR order (validates 3.1)', async () => {
  // **Validates: Requirements 3.1**
  const rng = mulberry32(21001);
  const ITERATIONS = 200;
  // Non-order event types. None of these call notifyNewQrOrder.
  const events = ['visibility-visible', 'visibility-hidden', 'click', 'keydown', 'touchstart', 'flash-nonorder', 'stopflash'];

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const env = setupSandbox({ resumeSucceeds: true }); // orderChimeCtx starts null
    const seqLen = 1 + randInt(rng, 6);

    for (let s = 0; s < seqLen; s++) {
      const ev = pick(rng, events);
      switch (ev) {
        case 'visibility-visible':
          env.doc._setHidden(false);
          env.doc._dispatch('visibilitychange');
          env.timers._tickTimeouts(); // fire any deferred stopFlashTitle
          break;
        case 'visibility-hidden':
          env.doc._setHidden(true);
          env.doc._dispatch('visibilitychange');
          break;
        case 'click':
        case 'keydown':
        case 'touchstart':
          // A user gesture that unlocks audio (but no order is pending).
          env.doc._dispatch(ev);
          await flushMicrotasks(); // let the unlock promise chain settle
          break;
        case 'flash-nonorder':
          env.sandbox.flashTitle('Some other non-order message');
          env.timers._tickIntervals();
          break;
        case 'stopflash':
          env.sandbox.stopFlashTitle();
          break;
      }
      assert.equal(
        env.allOscillators.length, 0,
        `iter ${iter} event ${s} (${ev}): no oscillator should be created without a QR order. ` +
        `Found ${env.allOscillators.length}`
      );
    }
  }
});

/* ===========================================================================
 * Test 2.2 — Toast Content Preservation  (validates 3.2)
 *
 * Property: for varied order shapes (table, item count/names/qty, totals,
 * missing fields) and both audio states (locked -> hint shown, unlocked -> no
 * hint), notifyNewQrOrder passes showToast the exact same title, summary/total
 * message, duration (0 = sticky), and the "Load & Print" / "Later" action
 * buttons (with "Load & Print" primary).
 * ========================================================================= */
test('2.2 — Toast Content Preservation: title/summary/total/buttons identical to baseline (validates 3.2)', () => {
  // **Validates: Requirements 3.2**
  const rng = mulberry32(22002);
  const ITERATIONS = 200;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const order = genOrder(rng);
    const serverId = 'srv-' + iter;
    // Vary the audio state so both the "sound locked" hint and the no-hint
    // message are exercised.
    const locked = rng() < 0.5;
    const env = setupSandbox({});
    env.sandbox.orderChimeCtx = locked ? null : makeRunningCtx();

    env.sandbox.notifyNewQrOrder(order, serverId);

    assert.equal(env.showToastCalls.length, 1, `iter ${iter}: showToast should be called exactly once`);
    const actual = env.showToastCalls[0];
    const expected = expectedToastOptions(env, order, serverId);

    assert.equal(actual.type, expected.type, `iter ${iter}: toast type should be 'info'`);
    assert.equal(actual.title, expected.title, `iter ${iter}: toast title mismatch (table=${JSON.stringify(order && order.table)})`);
    assert.equal(actual.message, expected.message, `iter ${iter}: toast message (summary/total/hint) mismatch`);
    assert.equal(actual.duration, expected.duration, `iter ${iter}: toast should be sticky (duration 0)`);
    assert.ok(Array.isArray(actual.actions), `iter ${iter}: toast should have actions`);
    assert.equal(actual.actions.length, 2, `iter ${iter}: toast should have exactly 2 action buttons`);
    assert.equal(actual.actions[0].label, 'Load & Print', `iter ${iter}: first button should be 'Load & Print'`);
    assert.equal(actual.actions[0].primary, true, `iter ${iter}: 'Load & Print' should be primary`);
    assert.equal(actual.actions[1].label, 'Later', `iter ${iter}: second button should be 'Later'`);
    assert.ok(!actual.actions[1].primary, `iter ${iter}: 'Later' should not be primary`);
  }
});

/* ===========================================================================
 * Test 2.3 — Title Flash Preservation  (validates 3.5)
 *
 * Property: notifyNewQrOrder calls flashTitle with '🔔 New order · Table ' +
 * <raw table>; flashTitle toggles document.title between that text and the
 * base title on each interval tick; stopFlashTitle clears the interval and
 * restores the base title; the visibilitychange listener schedules
 * stopFlashTitle (3s) only when the tab becomes visible.
 * ========================================================================= */
test('2.3 — Title Flash Preservation: flashTitle arg, toggle, stopFlashTitle, visibilitychange (validates 3.5)', async () => {
  // **Validates: Requirements 3.5**
  const rng = mulberry32(23003);

  // --- 3a. flashTitle is called with the correct (raw-table) argument, and the
  //     interval toggles title between the alert text and the base title.
  {
    const ITERATIONS = 100;
    for (let iter = 0; iter < ITERATIONS; iter++) {
      const order = genOrder(rng);
      const serverId = 'srv-' + iter;
      const env = setupSandbox({ hidden: false });
      env.sandbox.orderChimeCtx = null; // defer chime, no async; focus on flash

      env.sandbox.notifyNewQrOrder(order, serverId);
      const expectedFlash = '🔔 New order · Table ' + computeTable(order);
      const base = env.sandbox.baseDocTitle;

      // First interval tick -> alert text (verifies flashTitle's argument).
      env.timers._tickIntervals();
      assert.equal(env.doc.title, expectedFlash,
        `iter ${iter}: first flash tick should show the alert text (table=${JSON.stringify(order && order.table)})`);
      // Second tick -> base title (toggle off).
      env.timers._tickIntervals();
      assert.equal(env.doc.title, base, `iter ${iter}: second flash tick should restore the base title`);
      // Third tick -> alert text again (toggle on).
      env.timers._tickIntervals();
      assert.equal(env.doc.title, expectedFlash, `iter ${iter}: third flash tick should show alert text again`);
    }
  }

  // --- 3b. stopFlashTitle clears the interval and restores the base title.
  {
    const env = setupSandbox({});
    env.sandbox.orderChimeCtx = null;
    env.sandbox.notifyNewQrOrder({ table: 5, items: [], total: 0 }, 'srv-x');
    env.timers._tickIntervals();
    env.sandbox.stopFlashTitle();
    assert.equal(env.doc.title, env.sandbox.baseDocTitle, 'stopFlashTitle should restore the base title');
    const before = env.timers._intervalCount();
    env.timers._tickIntervals(); // should do nothing — interval cleared
    assert.equal(env.doc.title, env.sandbox.baseDocTitle, 'title must not change after stopFlashTitle (interval cleared)');
    assert.equal(env.timers._intervalCount(), before, 'no interval should remain after stopFlashTitle');
  }

  // --- 3c. visibilitychange: while hidden, no stop is scheduled; when the tab
  //     becomes visible, stopFlashTitle is deferred (3s) and then fires.
  {
    const env = setupSandbox({ hidden: true });
    env.sandbox.orderChimeCtx = null;
    env.sandbox.notifyNewQrOrder({ table: 7, items: [{ name: 'Coffee', qty: 1 }], total: 50 }, 'srv-y');
    env.timers._tickIntervals();
    assert.equal(env.doc.title, '🔔 New order · Table 7', 'alert text should be flashing while hidden');

    // Tab still hidden -> visibilitychange should NOT schedule a stop.
    env.doc._setHidden(true);
    env.doc._dispatch('visibilitychange');
    assert.equal(env.timers._timeoutCount(), 0, 'no stop should be scheduled while the tab stays hidden');

    // Tab becomes visible -> stop is deferred.
    env.doc._setHidden(false);
    env.doc._dispatch('visibilitychange');
    assert.equal(env.timers._timeoutCount(), 1, 'a deferred stopFlashTitle should be scheduled when the tab becomes visible');
    assert.equal(env.doc.title, '🔔 New order · Table 7', 'title should still be flashing before the deferred stop fires');

    // The deferred stop fires -> base title restored, flashing stops.
    env.timers._tickTimeouts();
    assert.equal(env.doc.title, env.sandbox.baseDocTitle, 'title should restore to base after the deferred stop fires');
    const before = env.timers._intervalCount();
    env.timers._tickIntervals();
    assert.equal(env.timers._intervalCount(), before, 'flashing must stop after the tab is viewed');
  }
});

/* ===========================================================================
 * Test 2.4 — System Notification Preservation  (validates 3.3)
 *
 * Property: a system Notification is created (with title 'New order · Table
 * <table>', body of 'name xqty' items joined, tag 'qr-order-<serverId>') if and
 * only if the billing tab is hidden AND Notification is supported AND permission
 * is 'granted'. Otherwise no Notification is created.
 * ========================================================================= */
test('2.4 — System Notification Preservation: created iff hidden & supported & granted (validates 3.3)', () => {
  // **Validates: Requirements 3.3**
  const rng = mulberry32(24004);
  const ITERATIONS = 200;
  const order = { table: 9, items: [{ name: 'Coffee', qty: 2 }, { name: 'Tea', qty: 1 }], total: 120 };
  const serverId = 'srv-notif';
  const expected = expectedNotification(order, serverId);

  const perms = ['granted', 'denied', 'default'];
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const hidden = rng() < 0.5;
    const permission = pick(rng, perms);
    const supported = rng() < 0.85; // mostly supported, occasionally absent

    const env = setupSandbox({
      hidden: hidden,
      permission: permission,
      noNotification: !supported,
    });
    env.sandbox.orderChimeCtx = null; // keep notifyNewQrOrder synchronous

    env.sandbox.notifyNewQrOrder(order, serverId);

    const shouldCreate = hidden && supported && permission === 'granted';
    if (shouldCreate) {
      assert.equal(env.Notification._calls.length, 1,
        `iter ${iter} (hidden=${hidden},perm=${permission},supported=${supported}): one Notification should be created`);
      const call = env.Notification._calls[0];
      assert.equal(call.title, expected.title, `iter ${iter}: notification title mismatch`);
      assert.equal(call.options.body, expected.body, `iter ${iter}: notification body mismatch`);
      assert.equal(call.options.tag, expected.tag, `iter ${iter}: notification tag mismatch`);
      assert.equal(typeof call.instance.onclick, 'function', `iter ${iter}: notification onclick handler should be a function`);
    } else {
      assert.equal(env.Notification._calls.length, 0,
        `iter ${iter} (hidden=${hidden},perm=${permission},supported=${supported}): no Notification should be created`);
    }
  }
});

/* ===========================================================================
 * Test 2.5 — Unlock Flow Preservation  (validates 3.4)
 *
 * Property: unlockOrderAlerts registers click/keydown/touchstart listeners on
 * first load; on a successful unlock it removes all three, requests
 * Notification permission once (only when permission is 'default'), and plays a
 * pending chime if one was deferred. A second gesture does nothing (listeners
 * removed). When the unlock fails, listeners are NOT removed (try again next
 * gesture).
 * ========================================================================= */
test('2.5 — Unlock Flow Preservation: listeners, removal, permission, pending chime (validates 3.4)', async () => {
  // **Validates: Requirements 3.4**

  // --- 5a. The three unlock listeners are registered on load (capture=true).
  {
    const env = setupSandbox({});
    const types = env.doc._addCalls.map(c => c.type);
    assert.ok(types.includes('click'), 'a click unlock listener should be registered');
    assert.ok(types.includes('keydown'), 'a keydown unlock listener should be registered');
    assert.ok(types.includes('touchstart'), 'a touchstart unlock listener should be registered');
    for (const t of ['click', 'keydown', 'touchstart']) {
      const calls = env.doc._addCalls.filter(c => c.type === t);
      assert.ok(calls.length >= 1, `${t} listener should be registered`);
      assert.equal(calls[0].capture, true, `${t} listener should use capture=true`);
    }
  }

  // --- 5b. Property loop: across (pending, permission) combos, a successful
  //     unlock removes all three listeners, requests permission iff 'default',
  //     plays the pending chime iff one was pending, and a second gesture is a
  //     no-op.
  const rng = mulberry32(25005);
  const ITERATIONS = 100;
  const perms = ['granted', 'denied', 'default'];
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const pending = rng() < 0.5;
    const permission = pick(rng, perms);
    const env = setupSandbox({ permission: permission, resumeSucceeds: true });
    env.sandbox.orderChimeCtx = null; // audio locked
    env.sandbox.orderChimePending = pending;

    const oscBefore = env.allOscillators.length;
    env.doc._dispatch('click'); // first user gesture
    await flushMicrotasks();

    // All three listeners removed after a successful unlock.
    const removedTypes = env.doc._removeCalls.map(c => c.type).sort();
    assert.deepEqual(removedTypes, ['click', 'keydown', 'touchstart'].sort(),
      `iter ${iter}: all three unlock listeners should be removed after a successful unlock`);
    for (const t of ['click', 'keydown', 'touchstart']) {
      assert.equal(env.doc._hasListener(t), false, `iter ${iter}: no ${t} listener should remain`);
    }

    // Pending chime plays iff an order was pending.
    if (pending) {
      assert.ok(env.allOscillators.length > oscBefore,
        `iter ${iter}: a pending chime should play when audio unlocks (pending=true)`);
      assert.equal(env.sandbox.orderChimePending, false,
        `iter ${iter}: orderChimePending should be cleared after the pending chime plays`);
    } else {
      assert.equal(env.allOscillators.length, oscBefore,
        `iter ${iter}: no chime should play when no order is pending (pending=false)`);
    }

    // Notification permission requested once iff it was 'default'.
    const rpExpected = permission === 'default' ? 1 : 0;
    assert.equal(env.Notification._requestPermissionCalls(), rpExpected,
      `iter ${iter}: requestPermission should be called ${rpExpected} time(s) for permission='${permission}'`);

    // --- second gesture is a no-op (listeners already removed) ---
    const oscAfterFirst = env.allOscillators.length;
    const rpAfterFirst = env.Notification._requestPermissionCalls();
    const remAfterFirst = env.doc._removeCalls.length;
    env.doc._dispatch('click');
    await flushMicrotasks();
    assert.equal(env.allOscillators.length, oscAfterFirst,
      `iter ${iter}: a second gesture must not play another chime`);
    assert.equal(env.Notification._requestPermissionCalls(), rpAfterFirst,
      `iter ${iter}: a second gesture must not request permission again`);
    assert.equal(env.doc._removeCalls.length, remAfterFirst,
      `iter ${iter}: a second gesture must not remove listeners again`);
  }

  // --- 5c. When the unlock fails (resume rejects), listeners are NOT removed so
  //     the next gesture can try again.
  {
    const env = setupSandbox({ permission: 'default', resumeSucceeds: false });
    env.sandbox.orderChimeCtx = null;
    env.sandbox.orderChimePending = true;

    env.doc._dispatch('click');
    await flushMicrotasks();

    assert.equal(env.doc._removeCalls.length, 0,
      'listeners should NOT be removed when the unlock fails (retry on next gesture)');
    assert.equal(env.allOscillators.length, 0,
      'no chime should play when the unlock fails');
    for (const t of ['click', 'keydown', 'touchstart']) {
      assert.equal(env.doc._hasListener(t), true, `${t} listener should remain after a failed unlock`);
    }
  }
});
