// Core Live Map types shared by lib, hooks, ui and scene (no runtime code).

export type TableStatus =
  | 'free' | 'occupied' | 'order_placed' | 'preparing' | 'ready_to_serve' | 'needs_bill';

export type Stage = 'placed' | 'preparing' | 'ready' | 'served';
export type ViewMode = 'closed' | 'balanced' | 'map_focus' | 'billing_focus';

export interface OrderItem {
  name: string; qty: number; price: number; total: number;
  emoji?: string; prefs: string[];            // from ice/sugar/size/note/spec
}

export interface ProgressRecord {
  orderId: string;                            // = orders/{id} key
  orderNo: string; table: string; total: number; createdAt: number;
  items: OrderItem[];
  stage: Stage;
  placedAt: number; preparingAt?: number; readyAt?: number; servedAt?: number;
  paid: boolean; paidAt?: number; billNo?: string;
  updatedAt: number;
}

export interface TableRecord { number: string; label: string; seats: number; occupied: boolean; }

export interface TableView {
  number: string; status: TableStatus; primary?: ProgressRecord; extraOrders: number; paid: boolean;
}

export interface MapEvent {
  id: string; at: number; table: string;
  kind: 'new' | 'stage' | 'paid' | 'closed' | 'error'; text: string;
}

export interface Pulse { table: string; at: number; }

export interface LiveCounters { open: number; avgPrepMin: number | null; todaySales: number | null; }

export interface LiveSnapshot {
  connected: boolean; ready: boolean;
  orders: ProgressRecord[];                   // active, sorted by createdAt asc
  tables: TableView[];                        // always 8, layout order
  counters: LiveCounters;                     // todaySales null when Bill_History_Store is unavailable
  events: MapEvent[];                         // newest first, max 8
  pulses: Pulse[];                            // new-order pulses < 1.5 s old
  selected: string | null;                    // table number
}

/** Bill record shape from billHistory.js (only fields the Live Map uses). */
export interface BillRecord { billNo: string; amount: number; date: string; }
