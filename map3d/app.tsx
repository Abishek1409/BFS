// Live Map app entry (lazy chunk, budget ≤ 90 KB gzip). The boot loader imports
// this module and calls mount()/unmount(); the 3D scene is a further lazy chunk.
import { createRoot, type Root } from 'react-dom/client';
import { getDb } from './lib/firebase.ts';
import { createLiveStore, type LiveStore } from './lib/store.ts';
import type { ViewMode } from './lib/types.ts';
import { LiveMapApp } from './ui/LiveMapApp.tsx';
import './ui/live-map.css';

export interface MountOptions {
  view: ViewMode;
  onView(v: ViewMode): void;
}

let root: Root | null = null;
let store: LiveStore | null = null;
let host: HTMLElement | null = null;

export function mount(el: HTMLElement, opts: MountOptions): void {
  if (host && host !== el) unmount();
  host = el;
  store ??= createLiveStore(getDb());
  root ??= createRoot(el);
  root.render(<LiveMapApp store={store} view={opts.view} onView={opts.onView} />);
}

/** Unmounts React (frees the WebGL context) and stops all store listeners. */
export function unmount(): void {
  root?.unmount();
  store?.dispose();
  root = null;
  store = null;
  host = null;
}
