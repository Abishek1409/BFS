// Order_Panel for the selected table: items, totals, stage buttons, Bill and Occupied (Req 7.3, 8).
import { useNow } from '../hooks/useNow.ts';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { BillingBridge } from '../lib/bridge.ts';
import { elapsed, money, shortOrderNo } from '../lib/format.ts';
import { findTable } from '../lib/layout.ts';
import { STATUS_META } from '../lib/status.ts';
import type { LiveSnapshot, Stage } from '../lib/types.ts';
import { statusStyle, useLiveMap } from './LiveMapContext.tsx';

const STAGES: { stage: Stage; label: string }[] = [
  { stage: 'placed', label: 'Placed' },
  { stage: 'preparing', label: 'Preparing' },
  { stage: 'ready', label: 'Ready' },
  { stage: 'served', label: 'Served' },
];

const selectedView = (s: LiveSnapshot) => s.tables.find(t => t.number === s.selected);

export function OrderPanel({ table }: { table: string }) {
  const { store, toBilling } = useLiveMap();
  const view = useLiveStore(store, selectedView);
  const now = useNow();   // also re-checks canBill, since orderQueue is not observable
  const label = findTable(table)?.label ?? `Table ${table}`;
  const close = () => store.select(null);

  if (!view) return null;
  const o = view.primary;
  const meta = STATUS_META[view.status];

  return (
    <section className="lm-orderpanel" aria-label={`${label} details`}>
      <div className="lm-op-head">
        <div>
          <div className="lm-op-title">{label}</div>
          <span className="lm-status" style={statusStyle(view.status)}>
            <span className="lm-dot" aria-hidden="true" />{meta.label}
            {view.paid && <span className="lm-badge lm-badge-paid">Paid</span>}
          </span>
        </div>
        <button type="button" className="lm-btn" onClick={close} aria-label="Close order panel">✕</button>
      </div>

      {!o ? (
        <>
          <p className="lm-empty">No open order at this table.</p>
          <button type="button" className="lm-btn" aria-pressed={view.status === 'occupied'}
            onClick={() => void store.setOccupied(table, view.status !== 'occupied')}>
            {view.status === 'occupied' ? 'Occupied · mark free' : 'Mark occupied'}
          </button>
        </>
      ) : (
        <div className="lm-scroll">
          <div className="lm-row lm-muted">
            <span>Order #{shortOrderNo(o.orderNo)}</span>
            <span>·</span>
            <span>{elapsed(o.createdAt, now)} ago</span>
            {view.extraOrders > 0 && <span className="lm-badge">+{view.extraOrders} more</span>}
          </div>

          <ul className="lm-items" aria-label="Items">
            {o.items.map((it, i) => (
              <li key={i} className="lm-item">
                <span>{it.emoji ? `${it.emoji} ` : ''}{it.name} × {it.qty}</span>
                <span className="lm-right">{money(it.total)}</span>
                {it.prefs.length > 0 && <span className="lm-item-prefs">{it.prefs.join(' · ')}</span>}
              </li>
            ))}
          </ul>
          <div className="lm-total"><span>Total</span><span>{money(o.total)}</span></div>

          <div className="lm-stages" role="group" aria-label="Order stage">
            {STAGES.map(s => (
              <button key={s.stage} type="button" className="lm-btn" aria-pressed={o.stage === s.stage}
                onClick={() => o.stage !== s.stage && void store.setStage(o.orderId, s.stage)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="lm-row">
            {o.paid ? (
              <span className="lm-badge lm-badge-paid">{o.billNo ? `Billed #${o.billNo}` : 'Billed'}</span>
            ) : BillingBridge.canBill(o.orderId) ? (
              <button type="button" className="lm-btn lm-btn-primary"
                onClick={() => toBilling(() => BillingBridge.billOrder(o.orderId))}>
                🧾 Bill
              </button>
            ) : (
              <span className="lm-badge">Billed</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
