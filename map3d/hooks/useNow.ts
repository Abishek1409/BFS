// Shared 1 Hz clock: one interval for every elapsed-time display (Req 6.2).
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (timer === undefined) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of [...listeners]) l();
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const get = () => now;

/** Current time in ms, refreshed once per second. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, get, get);
}
