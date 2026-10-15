// View_Mode state persisted in localStorage (Req 12.4, 12.5).
import { useCallback, useState } from 'react';
import type { ViewMode } from '../lib/types.ts';
import { readViewMode, saveViewMode } from '../lib/view.ts';

export { VIEW_KEY, isViewMode, readViewMode, saveViewMode } from '../lib/view.ts';

/**
 * View mode state. Only the mode changes here; table selection lives in the
 * LiveStore, so switching modes keeps it (Req 12.4).
 */
export function useViewMode(initial?: ViewMode, onChange?: (v: ViewMode) => void): [ViewMode, (v: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => initial ?? readViewMode());
  const set = useCallback((v: ViewMode) => {
    setMode(v);
    saveViewMode(v);
    onChange?.(v);
  }, [onChange]);
  return [mode, set];
}
