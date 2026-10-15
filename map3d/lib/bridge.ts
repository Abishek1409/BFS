// BillingBridge: the only touchpoint between the Live Map and existing billing globals.
// Callers switch the Live Map to Billing_Focus before calling these, so drawers,
// modals and print toasts appear in front as they do today (Req 8.2, 11.1).

interface QueueRow { serverId?: string; }

interface BillingGlobals {
  loadQrOrder?: (serverId: string) => void;
  clearBill?: () => void;
  openRptDrawer?: () => void;
  openHistDrawer?: () => void;
  orderQueue?: QueueRow[];
}

const g = () => globalThis as BillingGlobals;
const log = (msg: string, err: unknown) => console.error('[live-map]', msg, err);

function scrollTo(id: string): boolean {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function call(name: keyof BillingGlobals, fn: (() => void) | undefined): boolean {
  if (typeof fn !== 'function') return false;
  try {
    fn();
    return true;
  } catch (err) {
    log(`${name} failed`, err);
    return false;
  }
}

export const BillingBridge = {
  /** True while the order is still in the billing queue, i.e. not printed yet. */
  canBill(orderId: string): boolean {
    const q = g().orderQueue;
    return Array.isArray(q) && q.some(r => r.serverId === orderId) && typeof g().loadQrOrder === 'function';
  },

  /** Hand the order to the existing load-and-print flow. False when it was already printed. */
  billOrder(orderId: string): boolean {
    if (!BillingBridge.canBill(orderId)) return false;
    const load = g().loadQrOrder;
    return call('loadQrOrder', load && (() => load(orderId)));
  },

  newBill(): void {
    call('clearBill', g().clearBill);
    scrollTo('menuGrid');
  },

  showQueue(): void {
    scrollTo('oqList');
  },

  openReports(): void {
    call('openRptDrawer', g().openRptDrawer);
  },

  openHistory(): void {
    call('openHistDrawer', g().openHistDrawer);
  },
};
