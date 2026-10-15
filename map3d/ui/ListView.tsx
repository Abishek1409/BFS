// List_View: 2D table grid used as a toggle or as the fallback for the Map_Scene (Req 16).
// Selecting a tile opens the same Order_Panel in the Side_Panel.
import { useNow } from '../hooks/useNow.ts';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { elapsed, shortOrderNo } from '../lib/format.ts';
import { findTable } from '../lib/layout.ts';
import { STATUS_META } from '../lib/status.ts';
import { sel, statusStyle, useLiveMap } from './LiveMapContext.tsx';

export function ListView() {
  const { store, sceneFailed, listForced } = useLiveMap();
  const tables = useLiveStore(store, sel.tables);
  const selected = useLiveStore(store, sel.selected);
  const now = useNow();

  return (
    <section className="lm-panel lm-listview" aria-label="Tables">
      {listForced && (
        <p className="lm-notice" role="status">
          {sceneFailed ? '3D map stopped. Use Retry 3D below.' : '3D unavailable on this device.'}
        </p>
      )}
      <div className="lm-grid">
        {tables.map(t => {
          const meta = STATUS_META[t.status];
          const o = t.primary;
          return (
            <button key={t.number} type="button" className="lm-tile" style={statusStyle(t.status)}
              aria-pressed={selected === t.number}
              onClick={() => store.select(selected === t.number ? null : t.number)}>
              <span className="lm-tile-no">{findTable(t.number)?.label ?? `Table ${t.number}`}</span>
              <span className="lm-status">
                <span className="lm-dot" aria-hidden="true" />{meta.label}
                {t.paid && <span className="lm-badge lm-badge-paid">Paid</span>}
              </span>
              {o && (
                <span className="lm-order-meta">
                  #{shortOrderNo(o.orderNo)} · {elapsed(o.createdAt, now)}
                  {t.extraOrders > 0 && ` · +${t.extraOrders}`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
