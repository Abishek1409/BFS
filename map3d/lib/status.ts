// Table_Status derivation and the theme-harmonised status palette.
import { isClosable } from './progress.ts';
import type { ProgressRecord, Stage, TableRecord, TableStatus, TableView } from './types.ts';

export interface StatusMeta { label: string; color: string; cssVar: string; }

export const STATUS_META: Record<TableStatus, StatusMeta> = {
  free:           { label: 'Free',           color: '#3a3530', cssVar: '--lm-free' },
  occupied:       { label: 'Occupied',       color: '#8c7a5b', cssVar: '--lm-occupied' },
  order_placed:   { label: 'Order placed',   color: '#e8bd58', cssVar: '--lm-order-placed' },
  preparing:      { label: 'Preparing',      color: '#d98a3e', cssVar: '--lm-preparing' },
  ready_to_serve: { label: 'Ready to serve', color: '#6fbf73', cssVar: '--lm-ready' },
  needs_bill:     { label: 'Needs bill',     color: '#d96b55', cssVar: '--lm-needs-bill' },
};

export const STATUS_ORDER: readonly TableStatus[] = [
  'free', 'occupied', 'order_placed', 'preparing', 'ready_to_serve', 'needs_bill',
];

const STAGE_STATUS: Record<Stage, TableStatus> = {
  placed: 'order_placed',
  preparing: 'preparing',
  ready: 'ready_to_serve',
  served: 'needs_bill',     // only reached while unpaid; served + paid is closed
};

/** Status for one order (served + paid orders are closed, so they never get here). */
export function orderStatus(p: ProgressRecord): TableStatus {
  return STAGE_STATUS[p.stage];
}

/**
 * Combine a table with the active orders (any table; filtered here).
 * The oldest open order is primary; the rest count as `extraOrders`.
 */
export function deriveTableStatus(t: TableRecord, active: ProgressRecord[]): TableView {
  const mine = active
    .filter(p => p.table === t.number && !isClosable(p))
    .sort((a, b) => a.createdAt - b.createdAt);
  const primary = mine[0];
  if (!primary) {
    return { number: t.number, status: t.occupied ? 'occupied' : 'free', extraOrders: 0, paid: false };
  }
  return {
    number: t.number,
    status: orderStatus(primary),
    primary,
    extraOrders: mine.length - 1,
    paid: primary.paid,      // paid before served → stage colour + Paid badge (Req 8.6)
  };
}
