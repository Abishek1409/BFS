'use strict';

/*
 * Bug Condition Exploration Test — Property 1: Bug Condition
 *
 * Inaudible QR Order Chime Configuration
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4** (expected/fixed behaviour)
 *
 * These tests target the UNFIXED `playOrderChime` function in app.js. They
 * encode the EXPECTED (fixed) behaviour so that:
 *   - On UNFIXED code, the fix-checking assertions (1.1 waveform, 1.2 note
 *     count/duration, 1.3 frequency) FAIL — this FAILURE confirms each root
 *     cause (RC2 soft sine, RC3 too few/short notes, RC4 too-high frequencies).
 *   - Test 1.4 (audio-locked deferral) documents the EXISTING deferral
 *     behaviour and is expected to PASS on unfixed code (RC1 deferral works).
 *
 * CRITICAL: Do NOT modify these tests or the source to make them pass.
 * The failures ARE the expected outcome for the exploration phase.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Read the actual UNFIXED app.js source — we test the real code, not a copy.
const APP_PATH = path.join(__dirname, '..', 'app.js');
const appSource = fs.readFileSync(APP_PATH, 'utf8');

/**
 * Extract a top-level function body from source by name using brace matching
 * that is aware of strings, line comments and block comments so nested braces
 * (e.g. forEach callbacks) are handled correctly.
 *
 * @param {string} source - Full JS source text.
 * @param {string} name - Function name to extract (e.g. 'playOrderChime').
 * @returns {string} The complete function declaration text.
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
      if (ch === '\\') { i++; continue; } // skip escaped char
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

// Pre-extract the two functions we need from the unfixed source so a failure
// to locate them is caught early with a clear message.
const playOrderChimeSrc = extractFunction(appSource, 'playOrderChime');
const resumeOrderAudioSrc = extractFunction(appSource, 'resumeOrderAudio');

/**
 * Build a fake AudioContext that captures every OscillatorNode and GainNode
 * created, along with their configuration: waveform type, frequency, start/stop
 * times, and gain-envelope automation events. This lets the tests assert on the
 * chime configuration without requiring real audio output.
 *
 * @returns {{ ctx: object, oscillators: Array, gains: Array }}
 */
function createFakeAudioContext() {
  const oscillators = [];
  const gains = [];

  const ctx = {
    currentTime: 100,           // arbitrary stable base time
    state: 'running',
    destination: { __isDestination: true },
    createOscillator() {
      const osc = {
        type: null,
        frequency: { value: 0 },
        startTime: null,
        stopTime: null,
        connectedTo: null,
        connect(target) { osc.connectedTo = target; return target; },
        start(t) { osc.startTime = t; },
        stop(t) { osc.stopTime = t; },
      };
      oscillators.push(osc);
      return osc;
    },
    createGain() {
      const gain = {
        gain: {
          events: [],
          setValueAtTime(v, t) { gain.gain.events.push({ op: 'set', v, t }); },
          exponentialRampToValueAtTime(v, t) { gain.gain.events.push({ op: 'ramp', v, t }); },
        },
        connectedTo: null,
        connect(target) { gain.connectedTo = target; return target; },
      };
      gains.push(gain);
      return gain;
    },
  };

  return { ctx, oscillators, gains };
}

/**
 * Create a fresh VM sandbox holding the chime-related globals, then evaluate the
 * real (extracted from app.js) `resumeOrderAudio` and `playOrderChime` functions
 * into it. The returned sandbox exposes `playOrderChime` and the live globals
 * (`orderChimeCtx`, `orderChimePending`, `orderChimeResume`).
 *
 * @param {object|null} audioCtx - Fake AudioContext (or null to simulate locked audio).
 * @returns {{ sandbox: object, oscillators: Array, gains: Array }}
 */
function createChimeSandbox(audioCtx) {
  const oscillators = audioCtx ? audioCtx.oscillators : [];
  const gains = audioCtx ? audioCtx.gains : [];

  const sandbox = {
    orderChimeCtx: audioCtx ? audioCtx.ctx : null,
    orderChimePending: false,
    orderChimeResume: null,
    console: console,
    Promise: Promise,
  };

  vm.createContext(sandbox);
  // Evaluate both functions so playOrderChime can resolve resumeOrderAudio.
  vm.runInContext(resumeOrderAudioSrc + '\n' + playOrderChimeSrc, sandbox);

  return { sandbox, oscillators, gains };
}

/* ===========================================================================
 * Tests
 *
 * Tests 1.1–1.3 encode the FIXED (expected) behaviour. On UNFIXED code they
 * are EXPECTED TO FAIL — that failure confirms the bug exists (RC2/RC3/RC4).
 *
 * Test 1.4 documents the existing audio-locked deferral (RC1). It is EXPECTED
 * TO PASS on unfixed code because the deferral logic itself is correct.
 *
 * Requirement mapping (bug conditions explored):
 *   1.1 → RC2 (req 1.2 current / 2.2 expected): waveform too soft
 *   1.2 → RC3 (req 1.3 current / 2.3 expected): too few notes / too short
 *   1.3 → RC4 (req 1.4 current / 2.4 expected): frequencies too high
 *   1.4 → RC1 (req 1.1 current / 2.1 expected): chime deferred when audio locked
 * ========================================================================= */

test('1.1 — Sine Waveform Test: chime should use a louder waveform than sine (RC2)', () => {
  // **Validates: Requirements 2.2**
  const audioCtx = createFakeAudioContext();
  const { sandbox, oscillators } = createChimeSandbox(audioCtx);

  sandbox.playOrderChime();

  // Sanity: the chime must have created oscillators when audio is running.
  assert.ok(oscillators.length > 0, 'playOrderChime should create oscillators when audio is running');

  // FIXED behaviour: the waveform should NOT be (only) sine.
  // On UNFIXED code this FAILS because every oscillator uses type === 'sine'.
  const allSine = oscillators.every(o => o.type === 'sine');
  assert.equal(
    allSine, false,
    'chime should not use a pure sine waveform — sine is too soft for POS speakers (RC2). ' +
    'Found oscillator types: [' + oscillators.map(o => String(o.type)).join(', ') + ']'
  );
});

test('1.2 — Two-Note / Short Duration Test: chime should play more than 2 notes over >= 1.5s (RC3)', () => {
  // **Validates: Requirements 2.3**
  const audioCtx = createFakeAudioContext();
  const { sandbox, oscillators } = createChimeSandbox(audioCtx);

  sandbox.playOrderChime();

  assert.ok(oscillators.length > 0, 'playOrderChime should create oscillators when audio is running');

  // FIXED behaviour: more than two notes for an attention-grabbing pattern.
  // On UNFIXED code this FAILS because only 2 oscillators (notes) are created.
  assert.ok(
    oscillators.length > 2,
    'chime should play more than 2 notes to reliably attract attention (RC3). ' +
    'Found note count: ' + oscillators.length
  );

  // FIXED behaviour: total duration should be at least 1.5 s.
  // On UNFIXED code this FAILS: last stop (~1.235s) - first start (~0.005s) ~= 1.23s.
  const startTimes = oscillators.map(o => o.startTime).filter(t => t != null);
  const stopTimes = oscillators.map(o => o.stopTime).filter(t => t != null);
  const firstStart = Math.min(...startTimes);
  const lastStop = Math.max(...stopTimes);
  const totalDuration = lastStop - firstStart;

  assert.ok(
    totalDuration >= 1.5,
    'chime total duration should be >= 1.5s for an attention-grabbing pattern (RC3). ' +
    'Computed duration: ' + totalDuration.toFixed(3) + 's'
  );
});

test('1.3 — High Frequency Test: chime minimum frequency should be <= 1000 Hz (RC4)', () => {
  // **Validates: Requirements 2.4**
  const audioCtx = createFakeAudioContext();
  const { sandbox, oscillators } = createChimeSandbox(audioCtx);

  sandbox.playOrderChime();

  assert.ok(oscillators.length > 0, 'playOrderChime should create oscillators when audio is running');

  const frequencies = oscillators.map(o => o.frequency.value);
  const minFreq = Math.min(...frequencies);

  // FIXED behaviour: minimum frequency at or below ~1000 Hz (POS-friendly mid-range).
  // On UNFIXED code this FAILS because frequencies are 1568 Hz and 1174.7 Hz (both > 1000).
  assert.ok(
    minFreq <= 1000,
    'chime minimum frequency should be <= 1000 Hz to reproduce on small POS speakers (RC4). ' +
    'Found frequencies: [' + frequencies.join(', ') + '], min: ' + minFreq
  );
});

test('1.4 — Audio-Locked Deferral Test: chime deferred when AudioContext is null (RC1)', () => {
  // **Validates: Requirements 2.1**
  // This test documents EXISTING deferral behaviour — expected to PASS on unfixed code.
  const { sandbox, oscillators } = createChimeSandbox(null); // orderChimeCtx === null

  sandbox.playOrderChime();

  // When audio is not unlocked, the pending flag must be set and no oscillators created.
  assert.equal(
    sandbox.orderChimePending, true,
    'orderChimePending should be true when AudioContext is null (RC1 deferral)'
  );
  assert.equal(
    oscillators.length, 0,
    'no oscillators should be created when AudioContext is null (RC1 deferral). ' +
    'Found oscillators: ' + oscillators.length
  );
});
