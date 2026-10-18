// Live Map boot entry: always loaded on the billing page (budget ≤ 5 KB gzip).
// Starts the ProgressRecorder and exposes window.BFSLiveMap = { open, close }.
// React, the HUD and the 3D scene are fetched only when the map is opened (Req 2.1).
// Nothing here may throw into billing code, so every entry point is wrapped.
import { getDb } from './lib/firebase.ts';
import { startRecorder } from './lib/recorder.ts';
import type { ViewMode } from './lib/types.ts';
import { readViewMode, saveViewMode } from './lib/view.ts';

type AppModule = typeof import('./app.tsx');

const ROOT_ID = 'bfsLiveMap';
const log = (msg: string, err?: unknown) => console.error('[live-map]', msg, err ?? '');

let host: HTMLElement | null = null;
let app: AppModule | null = null;
let opening = 0;              // increments per open(); stale imports are ignored after close()

/** Loads app.css next to boot.js on first open, so the billing page doesn't pay for it up front. */
let cssReady: Promise<void> | null = null;
function loadCss(): Promise<void> {
  cssReady ??= new Promise<void>(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./app.css', import.meta.url).href;
    link.onload = () => resolve();
    link.onerror = () => { cssReady = null; link.remove(); resolve(); };
    document.head.appendChild(link);
  });
  return cssReady;
}

function getHost(): HTMLElement {
  if (!host) {
    host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);
  }
  return host;
}

function removeHost(): void {
  host?.remove();
  host = null;
}

/** HUD-styled skeleton shown while the app chunk downloads (Req 2.2). Uses app.css classes. */
function showSkeleton(el: HTMLElement): void {
  el.innerHTML =
    '<div class="lm-root lm-view-balanced" role="region" aria-label="BFS Live Map">' +
    '<div class="lm-skeleton" role="status" aria-live="polite"><div class="lm-panel lm-skel-box">' +
    '<span class="lm-muted">Loading Live Map…</span>' +
    '<div class="lm-skel-line"></div><div class="lm-skel-line"></div><div class="lm-skel-line"></div>' +
    '</div></div></div>';
}

/** Inline failure panel with Retry and Close; billing stays usable (Req 2.4). */
function showFailure(el: HTMLElement, view: ViewMode): void {
  el.innerHTML =
    '<div class="lm-root lm-view-balanced" role="region" aria-label="BFS Live Map">' +
    '<div class="lm-fail"><div class="lm-panel" role="alert">' +
    '<strong>Couldn\'t load the Live Map.</strong>' +
    '<span class="lm-muted">Check the connection and try again.</span>' +
    '<div class="lm-row"><button type="button" class="lm-btn lm-btn-primary" data-lm="retry">Retry</button>' +
    '<button type="button" class="lm-btn" data-lm="close">Close</button></div>' +
    '</div></div></div>';
  el.querySelector<HTMLButtonElement>('[data-lm="retry"]')?.addEventListener('click', () => open(view));
  el.querySelector<HTMLButtonElement>('[data-lm="close"]')?.addEventListener('click', () => close());
  el.querySelector<HTMLButtonElement>('[data-lm="retry"]')?.focus();
}

function onView(v: ViewMode): void {
  // Defer so React isn't unmounted from inside its own event handler.
  if (v === 'closed') queueMicrotask(close);
}

/** Opens the Live Map in the given (or last saved) View_Mode. */
async function open(view?: ViewMode): Promise<void> {
  try {
    if (app && host) return;                          // already open
    const saved = readViewMode();
    const mode: ViewMode = view ?? (saved === 'closed' ? 'balanced' : saved);
    const token = ++opening;
    const el = getHost();
    await loadCss();
    if (token !== opening) return;                    // closed while loading styles
    showSkeleton(el);
    let mod: AppModule;
    try {
      mod = await import('./app.tsx');
    } catch (err) {
      log('app chunk failed to load', err);
      if (token === opening) showFailure(el, mode);
      return;
    }
    if (token !== opening || host !== el) return;     // closed while loading
    el.textContent = '';
    app = mod;
    saveViewMode(mode);
    mod.mount(el, { view: mode, onView });
  } catch (err) {
    log('open failed', err);
  }
}

/** Closes the Live Map, unmounting React and freeing the WebGL context. */
function close(): void {
  try {
    opening++;
    app?.unmount();
    app = null;
    removeHost();
    saveViewMode('closed');
  } catch (err) {
    log('close failed', err);
  }
}

declare global {
  interface Window {
    BFSLiveMap?: { open(view?: ViewMode): Promise<void>; close(): void };
  }
}

try {
  const db = getDb();
  if (db) startRecorder(db);
} catch (err) {
  log('recorder start failed', err);
}

try {
  window.BFSLiveMap = { open, close };
  // The billing/menu page always loads first; the map opens only from the Live Map button.
  // The last View_Mode is still remembered and used when the button is clicked.
} catch (err) {
  log('boot failed', err);
}
