// Side_Panel: the Order_Panel for the selected table, otherwise the order list.
import { useLiveStore } from '../hooks/useLiveStore.ts';
import { OrderList } from './OrderList.tsx';
import { OrderPanel } from './OrderPanel.tsx';
import { sel, useLiveMap } from './LiveMapContext.tsx';

export function SidePanel() {
  const { store } = useLiveMap();
  const selected = useLiveStore(store, sel.selected);
  const count = useLiveStore(store, s => s.orders.length);

  return (
    <aside className="lm-panel lm-sidepanel" aria-label={selected ? 'Order details' : 'Open orders'}>
      {selected ? (
        <OrderPanel table={selected} />
      ) : (
        <>
          <h2>Open orders ({count})</h2>
          <div className="lm-scroll"><OrderList /></div>
        </>
      )}
    </aside>
  );
}
