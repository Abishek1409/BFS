// Colour legend for the six Table_Status values (Req 5.4).
import { STATUS_META, STATUS_ORDER } from '../lib/status.ts';
import { statusStyle } from './LiveMapContext.tsx';

export function Legend() {
  return (
    <section className="lm-panel lm-legend" aria-label="Table status legend">
      <h3>Legend</h3>
      <ul>
        {STATUS_ORDER.map(s => (
          <li key={s} style={statusStyle(s)}>
            <span className="lm-dot" aria-hidden="true" />
            {STATUS_META[s].label}
          </li>
        ))}
      </ul>
    </section>
  );
}
