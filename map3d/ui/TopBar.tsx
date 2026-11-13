// Top_Bar: live counters, offline pill, view toggle and close (Req 9, 14.5, 15.2, 15.3).
import { useEffect, useRef, useState } from 'react';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { PULSE_MS } from '../lib/events.ts';
import { money } from '../lib/format.ts';
import type { LiveSnapshot } from '../lib/types.ts';
import { nextView, sel, useLiveMap, VIEW_LABEL } from './LiveMapContext.tsx';

/** Timestamp of the newest 'new' event, used to flash the open counter. */
const lastNewAt = (s: LiveSnapshot) => s.events.find(e => e.kind === 'new')?.at ?? 0;

function useFlash(trigger: number): boolean {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }   // no flash for orders present at open
    if (!trigger) return;
    setOn(true);
    const t = setTimeout(() => setOn(false), PULSE_MS);
    return () => clearTimeout(t);
  }, [trigger]);
  return on;
}

export function TopBar() {
  const { store, view, setView } = useLiveMap();
  const counters = useLiveStore(store, sel.counters);
  const connected = useLiveStore(store, sel.connected);
  const ready = useLiveStore(store, sel.ready);
  const flash = useFlash(useLiveStore(store, lastNewAt));
  const avg = counters.avgPrepMin;

  return (
    <header className="lm-panel lm-topbar" aria-label="Live Map status">
      <span className="lm-brand">BFS Live</span>
      <span className={connected ? 'lm-pill' : 'lm-pill lm-pill-off'} role="status">
        {connected ? 'Live' : ready ? 'Offline · showing last data' : 'Connecting…'}
      </span>
      <div className={flash ? 'lm-counter lm-flash' : 'lm-counter'} aria-live="polite">
        <b>{counters.open}</b><span>Open orders</span>
      </div>
      <div className="lm-counter">
        <b>{avg == null ? '—' : `${Math.round(avg)}m`}</b><span>Avg prep</span>
      </div>
      <div className="lm-counter">
        <b>{money(counters.todaySales)}</b><span>Today's sales</span>
      </div>
      <span className="lm-spacer" />
      <button type="button" className="lm-btn" onClick={() => setView(nextView(view))}
        aria-label={`View mode: ${VIEW_LABEL[view]}. Switch to ${VIEW_LABEL[nextView(view)]}`}>
        ◐ {VIEW_LABEL[view]}
      </button>
      <button type="button" className="lm-btn" onClick={() => setView('closed')} aria-label="Close Live Map">✕</button>
    </header>
  );
}
