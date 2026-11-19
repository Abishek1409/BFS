# Bugfix Requirements Document

## Introduction

In the BFS POS/billing system, when a new QR order arrives, the cashier should hear a clear notification chime so they can act on the order promptly. Currently the generated two-note chime is frequently inaudible: it is blocked when the browser AudioContext has not been unlocked by a prior user gesture, and even when it plays it uses soft sine waves at high frequencies with a very short duration, so it does not reliably attract attention on typical POS speakers. This fix ensures the QR order alert is clearly audible and reliably delivered while preserving all existing non-audio alert behavior (toast, title flashing, system notification).

## Bug Analysis

### Current Behavior (Defect)

When a new QR order arrives, the alert sound is often not heard.

1.1 WHEN a QR order arrives AND the page AudioContext has not been unlocked by a prior user gesture THEN the system produces no audible chime (the chime is deferred via `orderChimePending` and may never play if the cashier does not interact with the page)
1.2 WHEN the notification chime plays THEN the system generates a two-note sine-wave chime whose perceived loudness is too low to be reliably heard on typical POS speakers
1.3 WHEN the notification chime plays THEN the system plays only two short notes (each decaying over ~0.9s, total ~1.2s) which does not reliably attract the cashier's attention in a busy environment
1.4 WHEN the notification chime plays THEN the system uses high frequencies (G6 at 1568 Hz and D6 at 1174.7 Hz) which reproduce poorly on small or low-quality speakers

### Expected Behavior (Correct)

The QR order notification should be clearly audible and reliably delivered.

2.1 WHEN a QR order arrives AND the page AudioContext has not been unlocked by a prior user gesture THEN the system SHALL provide a strong visual alert and SHALL play the audible chime as soon as the AudioContext becomes available, rather than silently dropping the alert
2.2 WHEN the notification chime plays THEN the system SHALL produce a clearly audible, attention-grabbing chime using a louder waveform type and increased gain compared to the current sine-wave implementation
2.3 WHEN the notification chime plays THEN the system SHALL play an attention-grabbing pattern of sufficient duration and/or repetition to reliably attract the cashier's attention
2.4 WHEN the notification chime plays THEN the system SHALL use frequencies that reproduce well on typical POS speakers

### Unchanged Behavior (Regression Prevention)

Existing non-audio alert behavior and AudioContext unlocking must continue to work.

3.1 WHEN no QR order has arrived THEN the system SHALL CONTINUE TO not play any notification sound
3.2 WHEN a QR order toast is shown THEN the system SHALL CONTINUE TO display the order summary (table, items, total) and the action buttons ("Load & Print" / "Later")
3.3 WHEN the billing tab is hidden AND a QR order arrives AND Notification permission is granted THEN the system SHALL CONTINUE TO show a system Notification with the order details
3.4 WHEN the user first interacts with the page THEN the system SHALL CONTINUE TO unlock the AudioContext and request system notification permission once
3.5 WHEN a QR order arrives THEN the system SHALL CONTINUE TO flash the document title with the new-order alert until the tab is viewed
