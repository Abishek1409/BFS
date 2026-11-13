// Top-down SVG overview built from SHOP_LAYOUT; tables are clickable (Req 14.1, 14.2).
import type { KeyboardEvent } from 'react';
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { SHOP_LAYOUT } from '../lib/layout.ts';
import { STATUS_META } from '../lib/status.ts';
import type { TableView } from '../lib/types.ts';
import { sel, statusStyle, useLiveMap } from './LiveMapContext.tsx';

const { floor, counters, tables: slots } = SHOP_LAYOUT;
const W = floor.width;
const D = floor.depth;
const PAD = 0.3;

export function Minimap() {
  const { store } = useLiveMap();
  const tables = useLiveStore(store, sel.tables);
  const selected = useLiveStore(store, sel.selected);
  const byNo = new Map<string, TableView>(tables.map(t => [t.number, t]));

  const pick = (n: string) => store.select(selected === n ? null : n);
  const onKey = (n: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n); }
  };

  return (
    <section className="lm-panel lm-minimap" aria-label="Minimap">
      <h3>Minimap</h3>
      <svg viewBox={`${-W / 2 - PAD} ${-D / 2 - PAD} ${W + PAD * 2} ${D + PAD * 2}`} role="group" aria-label="Shop layout">
        <rect className="lm-mm-floor" x={-W / 2} y={-D / 2} width={W} height={D} rx={0.3} />
        {counters.map(c => (
          <g key={c.id}>
            <rect className="lm-mm-counter" x={c.position[0] - c.size[0] / 2} y={c.position[1] - c.size[1] / 2}
              width={c.size[0]} height={c.size[1]} rx={0.1} />
            <text className="lm-mm-label" x={c.position[0]} y={c.position[1]}>{c.label}</text>
          </g>
        ))}
        {slots.map(slot => {
          const t = byNo.get(slot.number);
          const status = t?.status ?? 'free';
          const [x, z] = slot.position;
          const [w, d] = slot.size;
          return (
            <g key={slot.number} className="lm-mm-table" style={statusStyle(status)}
              role="button" tabIndex={0} aria-pressed={selected === slot.number}
              aria-label={`${slot.label}: ${STATUS_META[status].label}`}
              onClick={() => pick(slot.number)} onKeyDown={onKey(slot.number)}>
              <rect x={x - w / 2} y={z - d / 2} width={w} height={d} rx={0.15} />
              <text x={x} y={z}>{slot.number}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
