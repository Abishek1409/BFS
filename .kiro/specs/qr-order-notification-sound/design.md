# QR Order Notification Sound Bugfix Design

## Overview

When a new QR order arrives in the BFS POS/billing system, the cashier needs a clearly audible alert. The current `playOrderChime` function in `app.js` generates a two-note sine-wave chime at high frequencies (G6 1568 Hz, D6 1174.7 Hz) with a short total duration (~1.2 s). This chime is frequently inaudible on typical POS speakers for four compounding reasons: (1) the browser autoplay policy blocks the `AudioContext` until a user gesture occurs, deferring or dropping the chime; (2) the `sine` waveform is too soft to cut through ambient noise; (3) only two short notes do not reliably attract attention; and (4) the high frequencies reproduce poorly on small, low-quality speakers.

The fix targets the chime generation in `playOrderChime` while preserving all existing non-audio alert behavior (toast display, title flashing, system Notification) and the existing `AudioContext` unlock flow. The strategy is to switch to a louder waveform, move to mid-range frequencies, extend the pattern to a repeating attention-grabbing sequence, and keep the autoplay deferral logic intact so the improved chime plays as soon as audio becomes available.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a QR order arrives and the alert chime is not clearly audible, either because the `AudioContext` is not unlocked (chime deferred/dropped) or because the chime that plays is too soft, too short, or too high-pitched.
- **Property (P)**: The desired behavior — when a QR order arrives, the system SHALL play a clearly audible, attention-grabbing chime using a louder waveform, sufficient duration/repetition, and POS-friendly mid-range frequencies.
- **Preservation**: Existing non-audio alert behavior (toast with order summary and action buttons, document title flashing, system Notification) and the `AudioContext` unlock-on-first-gesture flow that must remain unchanged by the fix.
- **playOrderChime**: The function in `app.js` (~line 2688) that synthesizes the notification chime using the Web Audio API (`OscillatorNode` + `GainNode`).
- **unlockOrderAlerts**: The function in `app.js` (~line 2736) that creates and resumes the `orderChimeCtx` `AudioContext` on the first user gesture and plays any pending chime.
- **orderChimeCtx**: The `AudioContext` instance (`var orderChimeCtx`) used for chime playback; `null` until unlocked by a user gesture.
- **orderChimePending**: Boolean flag set when a QR order arrives before audio is unlocked; the deferred chime plays once `unlockOrderAlerts` resumes the context.
- **notifyNewQrOrder**: The function in `app.js` (~line 2640) invoked when a QR order arrives; it calls `playOrderChime`, shows the toast, flashes the title, and fires a system Notification.

## Bug Details

### Bug Condition

The bug manifests when a QR order arrives and the alert chime is not clearly audible. The `playOrderChime` function either defers/drops the chime because the `AudioContext` is not unlocked, or plays a chime that is too soft (sine waveform), too brief (only two notes, ~1.2 s total), or too high-pitched (G6 1568 Hz / D6 1174.7 Hz) to reproduce on typical POS speakers.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type QrOrderEvent {
           type: 'qr-order-arrival',
           order: { table, items, total },
           serverId: string
         }
         combined with systemState {
           audioContext: AudioContext | null,
           audioUnlocked: boolean,
           chimeWaveform: string,
           chimeNoteCount: number,
           chimeTotalDuration: number,   // seconds
           chimeMinFrequency: number      // Hz
         }
  OUTPUT: boolean

  RETURN input.type == 'qr-order-arrival'
         AND (    (NOT audioUnlocked)                          -- RC1: chime deferred or dropped
               OR (chimeWaveform == 'sine')                    -- RC2: waveform too soft
               OR (chimeNoteCount <= 2)                        -- RC3: too few notes / too short
               OR (chimeTotalDuration < 1.5)                   -- RC3: insufficient duration
               OR (chimeMinFrequency > 1000)                   -- RC4: frequencies too high for POS speakers
              )
END FUNCTION
```

### Examples

- **Audio locked, no prior gesture**: A QR order arrives for Table 5 immediately after page load (no click yet). `orderChimeCtx` is `null`, so `playOrderChime` sets `orderChimePending = true` and returns. No chime plays. Expected: the toast and title flash still appear, and the improved chime plays as soon as the cashier interacts and the `AudioContext` unlocks.
- **Soft sine waveform**: A QR order arrives after audio is unlocked. The chime plays using `osc.type = 'sine'` with peak gain 1.0. On a typical POS speaker the pure sine is barely audible over ambient noise. Expected: a louder waveform (e.g., `square` or `triangle`) makes the chime cut through.
- **Too short / too few notes**: A QR order arrives. The chime plays two notes (G6 then D6), each decaying over ~0.9 s, total ~1.2 s. In a busy environment the cashier may not notice. Expected: a repeating pattern of more notes over a longer duration (~2 s+) reliably attracts attention.
- **Too high-pitched**: A QR order arrives. The chime plays G6 (1568 Hz) and D6 (1174.7 Hz). On a small POS speaker these high frequencies reproduce weakly. Expected: mid-range frequencies (e.g., 660 Hz / 880 Hz) reproduce clearly.
- **Edge case — multiple orders while locked**: Two QR orders arrive while audio is still locked. `orderChimePending` is set `true` for each. When audio unlocks, the improved chime plays (not double-played). The toast/flash/notification for each order still fire independently.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When no QR order has arrived, no notification sound shall play (no chime on page load, navigation, or unrelated events).
- When a QR order toast is shown, the system shall continue to display the order summary (table, items, total) and the action buttons ("Load & Print" / "Later").
- When the billing tab is hidden and a QR order arrives and Notification permission is granted, the system shall continue to show a system Notification with the order details.
- When the user first interacts with the page, the system shall continue to unlock the `AudioContext` and request system Notification permission once.
- When a QR order arrives, the system shall continue to flash the document title with the new-order alert until the tab is viewed.

**Scope:**
All behavior that does NOT involve the chime sound generation should be completely unaffected by this fix. This includes:
- Toast rendering and its action-button click handlers (`loadQrOrder`, dismiss).
- Document title flashing (`flashTitle` / `stopFlashTitle`) and the `visibilitychange` listener.
- System Notification creation and its `onclick` focus handler.
- The `unlockOrderAlerts` event-listener registration (`click`, `keydown`, `touchstart`) and removal after first successful unlock.
- The `Notification.requestPermission` call on first gesture.

## Hypothesized Root Cause

Based on the bug description and source analysis, the most likely issues are:

1. **Autoplay Policy Blocking (RC1)**: When a QR order arrives before any user gesture, `orderChimeCtx` is `null` or its state is not `'running'`. `playOrderChime` sets `orderChimePending = true` and returns. The chime only plays later when `unlockOrderAlerts` resumes the context. If the cashier never interacts with the page (e.g., watching from another tab), the chime never plays.
   - The deferral logic itself is largely correct: `unlockOrderAlerts` does play the pending chime on first gesture, and a `pending=false` guard prevents double-play.
   - The gap is that the deferred chime may never fire, and the visual cue ("Click anywhere to enable the alert sound") is the only fallback.

2. **Soft Waveform (RC2)**: The chime uses `osc.type = 'sine'`. A sine wave has no harmonics beyond the fundamental, so at any given peak gain it carries less perceptual loudness than richer waveforms. On noisy POS speakers a sine chime is easily masked.
   - `square`, `sawtooth`, and `triangle` waveforms contain harmonics that make the tone louder and more attention-grabbing at the same peak amplitude.

3. **Insufficient Duration / Note Count (RC3)**: Only two notes are played (`[[1568, 0], [1174.7, 0.28]]`), each decaying over ~0.9 s for a total of ~1.2 s. A single brief two-note sequence does not reliably break through ambient noise or catch a distracted cashier's attention.
   - A repeating pattern (multiple bursts, like a telephone ring) over ~2 s+ is far more noticeable.

4. **Too-High Frequencies (RC4)**: G6 (1568 Hz) and D6 (1174.7 Hz) are in the upper mid/treble range. Small POS speakers (and laptop speakers) reproduce these frequencies weakly, attenuating the chime even when it does play.
   - Mid-range frequencies (roughly 500–1000 Hz) reproduce more efficiently on small speakers and remain clearly audible.

## Correctness Properties

Property 1: Bug Condition - Audible Attention-Grabbing QR Order Chime

_For any_ QR order arrival where the bug condition holds (the chime is inaudible because audio is unlocked but the chime is too soft, too short, or too high-pitched), the fixed `playOrderChime` function SHALL play a clearly audible, attention-grabbing chime using a louder waveform type (not `sine`), POS-friendly mid-range frequencies (minimum frequency at or below ~1000 Hz), and a pattern of sufficient duration (at least ~2 s and/or more than two notes) to reliably attract the cashier's attention, and when the `AudioContext` is not yet unlocked the function SHALL defer the improved chime to play as soon as audio becomes available rather than silently dropping it.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Chime Alert Behavior Unchanged

_For any_ QR order arrival (and any non-QR-order event), the fixed `notifyNewQrOrder` and surrounding code SHALL produce exactly the same non-audio behavior as the original code, preserving the toast display (order summary, total, action buttons), the document title flashing until the tab is viewed, the system Notification when the tab is hidden and permission is granted, the `AudioContext` unlock-on-first-gesture flow with one-time Notification permission request, and the absence of any notification sound when no QR order has arrived.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app.js`

**Function**: `playOrderChime` (~line 2688)

**Specific Changes**:

1. **Louder Waveform (RC2)**: Change the oscillator type from `sine` to a richer waveform.
   - Replace `osc.type = 'sine';` with `osc.type = 'square';` (loudest, most attention-grabbing). `triangle` is a softer alternative if `square` proves too harsh in testing.
   - The richer harmonic content increases perceived loudness at the same peak gain.

2. **POS-Friendly Frequencies (RC4)**: Lower the note frequencies from the G6/D6 range into the mid-range.
   - Replace the note array `[[1568, 0], [1174.7, 0.28]]` with mid-range tones, e.g., alternating 660 Hz (E5) and 880 Hz (A5), which reproduce clearly on small speakers while remaining distinct and attention-grabbing.

3. **Extended Attention-Grabbing Pattern (RC3)**: Increase note count and total duration.
   - Expand from 2 notes to a repeating multi-note pattern (e.g., 3 bursts of a 2-tone alternation, ~6 notes total) spanning ~2 s+, mimicking a telephone-ring cadence that reliably cuts through ambient noise.
   - Adjust each note's start offset and decay envelope so notes do not overlap and the pattern is clearly rhythmic.

4. **Gain / Loudness Control (RC2)**: Ensure the chime is loud without clipping.
   - Keep per-note peak gain high (e.g., 0.7–0.8) so the square waveform is clearly audible but not painfully harsh.
   - Optionally route all oscillators through a single master `GainNode` (and optionally a `DynamicsCompressorNode`) before `ctx.destination` to control overall level and prevent clipping when multiple notes play, effectively increasing the delivered/perceived gain compared to the isolated sine implementation.

5. **Autoplay Deferral Robustness (RC1)**: Preserve and harden the deferred-playback path.
   - Keep the existing `orderChimePending` deferral so the improved chime plays as soon as `unlockOrderAlerts` resumes the `AudioContext`.
   - Ensure the deferred chime uses the new improved pattern (no code path plays the old two-note sine).
   - Verify the `pending=false` guard in the playing branch prevents double-play when both `playOrderChime`'s resume callback and `unlockOrderAlerts` fire.
   - Keep the toast's "Click anywhere on the page once to enable the alert sound" message as the visual fallback when audio is locked, satisfying the "strong visual alert" requirement.

**What does NOT change**: `notifyNewQrOrder` (other than the chime it triggers), `showToast` call and its arguments, `flashTitle`/`stopFlashTitle`, the `visibilitychange` listener, the system `Notification` block, `unlockOrderAlerts` (event registration, context creation/resume, permission request), and the `resumeOrderAudio` helper.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior. Because the chime is a synthesized Web Audio signal, tests assert on the oscillator/gain configuration and scheduling (waveform type, frequencies, note count, duration, gain) rather than requiring actual audio output.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that inspect the `playOrderChime` oscillator configuration and scheduling on the UNFIXED code to confirm each root cause. These tests observe the `OscillatorNode.type`, `.frequency.value`, start/stop times, and `GainNode` envelope on a stubbed `AudioContext`.

**Test Cases**:
1. **Sine Waveform Test**: Assert that the unfixed chime uses `osc.type === 'sine'` (will confirm RC2).
2. **Two-Note / Short Duration Test**: Assert that the unfixed chime schedules exactly 2 notes and total duration < 1.5 s (will confirm RC3).
3. **High Frequency Test**: Assert that the unfixed chime's minimum frequency > 1000 Hz (1568/1174.7) (will confirm RC4).
4. **Audio-Locked Deferral Test**: Call `playOrderChime` with `orderChimeCtx === null` and assert `orderChimePending === true` and no oscillators created (will confirm RC1 deferral).

**Expected Counterexamples**:
- Chime waveform is `sine`, only 2 notes, frequencies above 1000 Hz, total under 1.5 s.
- Possible causes confirmed: soft waveform, too few/short notes, too-high frequencies, deferred playback when audio locked.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := playOrderChime_fixed(input)
  ASSERT expectedBehavior(result)
  -- expectedBehavior: waveform != 'sine', minFrequency <= 1000,
  --                   noteCount > 2, totalDuration >= 2.0, peakGain adequate,
  --                   AND when audio unlocked the chime actually plays
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT notifyNewQrOrder_original(input) behaves identically to notifyNewQrOrder_fixed(input)
  -- for non-audio behavior: same toast content/buttons, same title flash,
  -- same system Notification, same unlock flow, no sound when no QR order
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (order variations, tab visibility, notification permission states).
- It catches edge cases that manual unit tests might miss (e.g., missing items, null totals, hidden vs visible tab).
- It provides strong guarantees that non-audio behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on UNFIXED code first for toast content, title flashing, system notifications, and the unlock flow, then write property-based tests capturing that behavior and re-run after the fix.

**Test Cases**:
1. **Toast Preservation**: Verify the toast title, summary, total, and action buttons ("Load & Print" / "Later") are identical before and after the fix for varied order shapes.
2. **Title Flash Preservation**: Verify `flashTitle` is called with the same argument and `stopFlashTitle` behavior on `visibilitychange` is unchanged.
3. **System Notification Preservation**: Verify a `Notification` is created with the same title/body/tag when the tab is hidden and permission is granted, and not created otherwise.
4. **Unlock Flow Preservation**: Verify `unlockOrderAlerts` still registers `click`/`keydown`/`touchstart` listeners, removes them after first successful unlock, requests Notification permission once, and plays a pending chime.
5. **No-Order Silence Preservation**: Verify no oscillator is ever created when `notifyNewQrOrder` / `playOrderChime` is not triggered by a QR order arrival.

### Unit Tests

- Test `playOrderChime` oscillator/gain configuration: waveform type is not `sine`, frequencies are mid-range (<= 1000 Hz min), note count > 2, total duration >= 2 s, per-note peak gain is high.
- Test the autoplay deferral path: with `orderChimeCtx === null`, `orderChimePending` becomes `true` and no oscillators are created; after `unlockOrderAlerts` resumes the context, the improved chime plays exactly once (no double-play).
- Test edge cases: missing `order.table`, empty `items`, zero `total`, AudioContext unavailable (`window.AudioContext` undefined).

### Property-Based Tests

- Generate random QR order events (varying table, item count, item names, totals) and verify the chime configuration (waveform, frequencies, note count, duration) is correct and independent of order content.
- Generate random system states (audio locked/unlocked, tab visible/hidden, notification permission granted/denied/default) and verify non-audio behavior (toast, title flash, Notification, unlock) matches the original for all combinations.
- Generate random sequences of order arrivals interleaved with user gestures and verify the pending-chime flag and double-play guard behave correctly.

### Integration Tests

- Test the full QR order arrival flow: a QR order arrives, the toast appears with the correct summary/buttons, the title flashes, and (when unlocked) the improved chime plays with the expected waveform/frequency/duration.
- Test the locked-to-unlocked transition: an order arrives while audio is locked (toast shows the "click to enable" hint), the cashier clicks, the `AudioContext` unlocks, and the improved chime plays once.
- Test context switching / tab visibility: an order arrives while the tab is hidden (system Notification fires, title flashes) and when the tab becomes visible the title stops flashing after the existing delay, with the chime playing if audio was unlocked.
