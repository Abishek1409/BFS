// Document visibility, used to stop rendering while the tab is hidden (Req 17.3).
import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void): () => void {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}

const get = () => document.visibilityState !== 'hidden';
const getServer = () => true;

export function useTabVisible(): boolean {
  return useSyncExternalStore(subscribe, get, getServer);
}
