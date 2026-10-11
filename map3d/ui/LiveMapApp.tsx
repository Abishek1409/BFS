// Live Map root: HUD grid around the Map_Scene (or ListView), view-mode classes,
// Esc to clear the selection, lazy scene with Suspense and an error boundary.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useViewMode } from '../hooks/useViewMode.ts';
import type { LiveStore } from '../lib/store.ts';
import type { ViewMode } from '../lib/types.ts';
import { hasWebGL } from '../lib/webgl.ts';
import { BottomBar } from './BottomBar.tsx';
import { Legend } from './Legend.tsx';
import { ListView } from './ListView.tsx';
import { LiveMapContext, type LiveMapCtx } from './LiveMapContext.tsx';
import { LoadingSkeleton } from './LoadingSkeleton.tsx';
import { Minimap } from './Minimap.tsx';
import { SceneBoundary } from './SceneBoundary.tsx';
import { SidePanel } from './SidePanel.tsx';
import { TopBar } from './TopBar.tsx';

export interface LiveMapAppProps {
  store: LiveStore;
  view: ViewMode;
  onView(v: ViewMode): void;
}

/** New lazy component per attempt: React.lazy caches a rejected import, so Retry needs a fresh one. */
const loadScene = () => lazy(() => import('../scene/ShopScene.tsx'));

export function LiveMapApp({ store, view: initialView, onView }: LiveMapAppProps) {
  const [view, setView] = useViewMode(initialView, onView);
  const webgl = useMemo(hasWebGL, []);
  const [listToggled, setListToggled] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const ShopScene = useMemo(loadScene, [attempt]);
  const resetRef = useRef<(() => void) | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const listForced = !webgl || sceneFailed;
  const listShown = listForced || listToggled;

  // Esc clears the selection (Req 7.5). Billing_Focus leaves Esc to the billing page.
  useEffect(() => {
    if (view === 'billing_focus') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.getSnapshot().selected !== null) store.select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store, view]);

  // A lost GL context is not a React error, so catch it on the stage (capture: it doesn't bubble).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onLost = () => setSceneFailed(true);
    el.addEventListener('webglcontextlost', onLost, true);
    return () => el.removeEventListener('webglcontextlost', onLost, true);
  }, []);

  const toBilling = useCallback((action: () => void) => {
    setView('billing_focus');
    // Let the layer drop behind billing before drawers and modals open.
    requestAnimationFrame(() => action());
  }, [setView]);

  const ctx = useMemo<LiveMapCtx>(() => ({
    store,
    view,
    setView,
    toBilling,
    listShown,
    listForced,
    toggleList: () => setListToggled(v => !v),
    sceneFailed,
    retryScene: () => {
      setSceneFailed(false);
      setListToggled(false);
      setAttempt(n => n + 1);
    },
    resetView: () => resetRef.current?.(),
  }), [store, view, setView, toBilling, listShown, listForced, sceneFailed]);

  return (
    <LiveMapContext.Provider value={ctx}>
      <div className={`lm-root lm-view-${view}`} role="region" aria-label="BFS Live Map">
        <div className="lm-stage" ref={stageRef} aria-hidden={view === 'billing_focus' || undefined}>
          {!listShown && (
            <SceneBoundary key={attempt} onError={() => setSceneFailed(true)}>
              <Suspense fallback={<LoadingSkeleton />}>
                <ShopScene store={store} view={view} resetRef={resetRef} />
              </Suspense>
            </SceneBoundary>
          )}
        </div>

        {view === 'billing_focus' ? (
          <button type="button" className="lm-btn lm-back" onClick={() => setView('balanced')}>
            🗺️ Back to map
          </button>
        ) : (
          <div className="lm-hud">
            <div className="lm-top"><TopBar /></div>
            <div className="lm-left"><Minimap /><Legend /></div>
            <div className="lm-center">{listShown && <ListView />}</div>
            <div className="lm-side"><SidePanel /></div>
            <div className="lm-bottom"><BottomBar /></div>
          </div>
        )}
      </div>
    </LiveMapContext.Provider>
  );
}
