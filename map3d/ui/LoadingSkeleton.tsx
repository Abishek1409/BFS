// HUD-styled placeholder while a lazy chunk loads (Req 2.2).
export function LoadingSkeleton({ label = 'Loading 3D map…' }: { label?: string }) {
  return (
    <div className="lm-skeleton" role="status" aria-live="polite">
      <div className="lm-panel lm-skel-box">
        <span className="lm-muted">{label}</span>
        <div className="lm-skel-line" />
        <div className="lm-skel-line" />
        <div className="lm-skel-line" />
      </div>
    </div>
  );
}
