// prefers-reduced-motion media query.
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
const mql = () => (typeof matchMedia === 'function' ? matchMedia(QUERY) : null);

function subscribe(cb: () => void): () => void {
  const m = mql();
  m?.addEventListener('change', cb);
  return () => m?.removeEventListener('change', cb);
}

const get = () => mql()?.matches ?? false;
const getServer = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, get, getServer);
}
