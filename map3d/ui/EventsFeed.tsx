// Events_Feed: the 8 most recent order events, newest first (Req 11.3, 11.4).
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { sel, useLiveMap } from './LiveMapContext.tsx';

const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' });

export function EventsFeed() {
  const { store } = useLiveMap();
  const events = useLiveStore(store, sel.events);

  return (
    <ul className="lm-feed" aria-live="polite" aria-label="Recent events">
      {events.length === 0 && <li className="lm-muted">No events yet.</li>}
      {events.map(e => (
        <li key={e.id} className={e.kind === 'error' ? 'lm-ev-error' : undefined}>
          <time dateTime={new Date(e.at).toISOString()}>{time.format(e.at)}</time>
          {e.table && <span className="lm-ev-table">T{e.table}</span>}
          <span>{e.text}</span>
        </li>
      ))}
    </ul>
  );
}
