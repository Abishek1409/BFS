// Subscribe a component to a slice of the LiveStore snapshot.
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { LiveStore } from '../lib/store.ts';
import type { LiveSnapshot } from '../lib/types.ts';

const identity = (s: LiveSnapshot) => s;

/**
 * Returns `selector(snapshot)`. Re-renders only when the selected value changes
 * (by `isEqual`, default Object.is). Snapshots are immutable, so slices are stable.
 */
export function useLiveStore<T = LiveSnapshot>(
  store: LiveStore,
  selector: (s: LiveSnapshot) => T = identity as (s: LiveSnapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const cache = useRef<{ snap: LiveSnapshot; value: T } | null>(null);
  const get = useCallback(() => {
    const snap = store.getSnapshot();
    const c = cache.current;
    if (c && c.snap === snap) return c.value;
    const value = selector(snap);
    if (c && isEqual(c.value, value)) {
      cache.current = { snap, value: c.value };
      return c.value;
    }
    cache.current = { snap, value };
    return value;
  }, [store, selector, isEqual]);
  return useSyncExternalStore(store.subscribe, get, get);
}
