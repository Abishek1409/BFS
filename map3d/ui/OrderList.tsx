// Active orders, oldest first; clicking an order selects its table (Req 7.4, 10).
import { useNow } from '../hooks/useNow.ts';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { elapsed, money, shortOrderNo } from '../lib/format.ts';
import { findTable } from '../lib/layout.ts';
import { orderStatus, STATUS_META } from '../lib/status.ts';
import { sel, statusStyle, useLiveMap } from './LiveMapContext.tsx';

export function OrderList() {
  const { store } = useLiveMap();
  const orders = useLiveStore(store, sel.orders);   // already sorted by createdAt asc
  const ready = useLiveStore(store, sel.ready);
  const now = useNow();

  if (!orders.length) {
    return <p className="lm-empty">{ready ? 'No open orders. New QR orders appear here.' : 'Loading orders…'}</p>;
  }

  return (
    <ul className="lm-orders" aria-label="Open orders">
      {orders.map(o => {
        const status = orderStatus(o);
        const known = !!findTable(o.table);
        const count = o.items.reduce((n, i) => n + i.qty, 0);
        return (
          <li key={o.orderId}>
            <button type="button" className="lm-order" style={statusStyle(status)}
              aria-disabled={!known}
              aria-label={`Table ${o.table}, order ${shortOrderNo(o.orderNo)}, ${STATUS_META[status].label}`}
              onClick={() => known && store.select(o.table)}>
              <span className="lm-order-head">
                Table {o.table} · #{shortOrderNo(o.orderNo)}{' '}
                {!known && <span className="lm-badge lm-badge-warn">Unknown table</span>}
                {o.paid && <span className="lm-badge lm-badge-paid">Paid</span>}
              </span>
              <span className="lm-right lm-order-head">{money(o.total)}</span>
              <span className="lm-status lm-order-meta">
                <span className="lm-dot" aria-hidden="true" />{STATUS_META[status].label} · {count} item{count === 1 ? '' : 's'}
              </span>
              <span className="lm-right lm-order-meta">{elapsed(o.createdAt, now)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
