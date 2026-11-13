// Floating label above a table: order no. + elapsed time (+N badge), or the table number when no
// order is active (Req 6.1–6.4). The elapsed time refreshes from the shared 1 Hz clock.
import { Html } from '@react-three/drei/web/Html.js';
import { useNow } from '../hooks/useNow.ts';
import { elapsed, shortOrderNo } from '../lib/format.ts';
import type { TableView } from '../lib/types.ts';
import { statusStyle } from '../ui/LiveMapContext.tsx';

function OrderLabel({ t }: { t: TableView }) {
  const now = useNow();
  const o = t.primary!;
  return (
    <>
      <span className="lm-marker-no">#{shortOrderNo(o.orderNo)}</span>
      <span className="lm-marker-time">{elapsed(o.createdAt, now)}</span>
      {t.extraOrders > 0 && <span className="lm-badge">+{t.extraOrders}</span>}
      {t.paid && <span className="lm-badge lm-badge-paid">Paid</span>}
    </>
  );
}

export function StatusMarker({ t, label, height }: { t: TableView; label: string; height: number }) {
  return (
    <Html position={[0, height, 0]} center distanceFactor={10} zIndexRange={[20, 0]} pointerEvents="none">
      <div className="lm-marker" style={statusStyle(t.status)} aria-hidden="true">
        <span className="lm-dot" />
        {t.primary ? <OrderLabel t={t} /> : <span className="lm-marker-no">{label}</span>}
      </div>
    </Html>
  );
}
