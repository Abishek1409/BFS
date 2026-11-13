// View_Mode persistence shared by the boot loader and the React hook (Req 12.5).
// Kept React-free so boot.js stays small.
import type { ViewMode } from './types.ts';

export const VIEW_KEY = 'bfs.liveMap.view';
const MODES: readonly ViewMode[] = ['closed', 'balanced', 'map_focus', 'billing_focus'];

export function isViewMode(v: unknown): v is ViewMode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v);
}

/** Last saved View_Mode, or 'closed' when none or storage is blocked. */
export function readViewMode(): ViewMode {
  try {
    const v = globalThis.localStorage?.getItem(VIEW_KEY);
    return isViewMode(v) ? v : 'closed';
  } catch {
    return 'closed';
  }
}

export function saveViewMode(v: ViewMode): void {
  try {
    globalThis.localStorage?.setItem(VIEW_KEY, v);
  } catch { /* storage blocked: mode just isn't restored */ }
}
