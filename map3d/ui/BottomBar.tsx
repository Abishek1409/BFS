// Bottom_Bar: billing quick actions, reset view, view-mode and list toggles, events feed (Req 11).
import { BillingBridge } from '../lib/bridge.ts';
import { EventsFeed } from './EventsFeed.tsx';
import { nextView, useLiveMap, VIEW_LABEL } from './LiveMapContext.tsx';

export function BottomBar() {
  const { view, setView, toBilling, listShown, listForced, toggleList, sceneFailed, retryScene, resetView } = useLiveMap();

  return (
    <footer className="lm-panel lm-bottombar">
      <div className="lm-actions" role="group" aria-label="Billing quick actions">
        <button type="button" className="lm-btn" onClick={() => toBilling(BillingBridge.newBill)}>＋ New bill</button>
        <button type="button" className="lm-btn" onClick={() => toBilling(BillingBridge.showQueue)}>Queue</button>
        <button type="button" className="lm-btn" onClick={() => toBilling(BillingBridge.openReports)}>Reports</button>
        <button type="button" className="lm-btn" onClick={() => toBilling(BillingBridge.openHistory)}>History</button>
      </div>
      <div className="lm-actions" role="group" aria-label="Map controls">
        <button type="button" className="lm-btn" onClick={resetView} disabled={listShown} aria-label="Reset camera view">⟲</button>
        <button type="button" className="lm-btn" onClick={() => setView(nextView(view))}
          aria-label={`View mode: ${VIEW_LABEL[view]}. Switch to ${VIEW_LABEL[nextView(view)]}`}>◐</button>
        {sceneFailed ? (
          <button type="button" className="lm-btn" onClick={retryScene}>Retry 3D</button>
        ) : (
          <button type="button" className="lm-btn" onClick={toggleList} disabled={listForced}
            aria-pressed={listShown} aria-label="List view">☰</button>
        )}
      </div>
      <EventsFeed />
    </footer>
  );
}
