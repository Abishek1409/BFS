// Shared Live Map UI state passed to HUD components (store, view mode, list/scene state).
import { createContext, useContext, type CSSProperties } from 'react';
import type { LiveStore } from '../lib/store.ts';
import { STATUS_META } from '../lib/status.ts';
import type { LiveSnapshot, TableStatus, ViewMode } from '../lib/types.ts';

export interface LiveMapCtx {
  store: LiveStore;
  view: ViewMode;
  setView(v: ViewMode): void;
  /** Switch to Billing_Focus, then run a billing action (Req 8.2, 11.1). */
  toBilling(action: () => void): void;
  listShown: boolean;          // ListView visible (toggle, no WebGL or scene error)
  listForced: boolean;         // no WebGL or scene error: toggle cannot return to 3D
  toggleList(): void;
  sceneFailed: boolean;
  retryScene(): void;
  resetView(): void;
}

export const LiveMapContext = createContext<LiveMapCtx | null>(null);

export function useLiveMap(): LiveMapCtx {
  const ctx = useContext(LiveMapContext);
  if (!ctx) throw new Error('[live-map] LiveMapContext missing');
  return ctx;
}

/** Inline style exposing the status colour as `--lm-c` (always paired with a text label). */
export function statusStyle(s: TableStatus): CSSProperties {
  return { '--lm-c': `var(${STATUS_META[s].cssVar}, ${STATUS_META[s].color})` } as CSSProperties;
}

// Stable selectors for useLiveStore.
export const sel = {
  orders: (s: LiveSnapshot) => s.orders,
  tables: (s: LiveSnapshot) => s.tables,
  selected: (s: LiveSnapshot) => s.selected,
  counters: (s: LiveSnapshot) => s.counters,
  connected: (s: LiveSnapshot) => s.connected,
  ready: (s: LiveSnapshot) => s.ready,
  events: (s: LiveSnapshot) => s.events,
  pulsing: (s: LiveSnapshot) => s.pulses.length > 0,
};

export const VIEW_LABEL: Record<ViewMode, string> = {
  closed: 'Closed',
  balanced: 'Balanced',
  map_focus: 'Map focus',
  billing_focus: 'Billing focus',
};

const CYCLE: Record<ViewMode, ViewMode> = {
  closed: 'balanced',
  balanced: 'map_focus',
  map_focus: 'billing_focus',
  billing_focus: 'balanced',
};

export const nextView = (v: ViewMode): ViewMode => CYCLE[v];
