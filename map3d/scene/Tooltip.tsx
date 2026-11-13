// Hover tooltip: table number, Table_Status and order total (Req 14.3).
import { Html } from '@react-three/drei/web/Html.js';
import { money } from '../lib/format.ts';
import { STATUS_META } from '../lib/status.ts';
import type { TableView } from '../lib/types.ts';
import { statusStyle } from '../ui/LiveMapContext.tsx';

export function Tooltip({ t, label, height }: { t: TableView; label: string; height: number }) {
  return (
    <Html position={[0, height, 0]} center zIndexRange={[30, 21]} pointerEvents="none">
      <div className="lm-tooltip" role="tooltip" style={statusStyle(t.status)}>
        <strong>{label}</strong>
        <span className="lm-status"><span className="lm-dot" aria-hidden="true" />{STATUS_META[t.status].label}</span>
        <span>{t.primary ? money(t.primary.total) : 'No order'}</span>
      </div>
    </Html>
  );
}
