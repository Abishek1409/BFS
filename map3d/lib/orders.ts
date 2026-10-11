// Shared order mapping for raw `orders/{id}` records written by the QR site.
import type { OrderItem } from './types.ts';

export interface RawOrderItem {
  name?: unknown; emoji?: unknown; price?: unknown; qty?: unknown; total?: unknown;
  ice?: unknown; sugar?: unknown; size?: unknown; note?: unknown; spec?: unknown;
}

export interface NormalizedOrder {
  orderNo: string; table: string; total: number; createdAt: number;
  status: string; items: OrderItem[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
};

/** Valid when the record has a non-empty table and a numeric createdAt (Req 1.6). */
export function isValidOrder(raw: unknown): raw is Obj {
  if (!isObj(raw)) return false;
  const createdAt = raw.createdAt;
  return str(raw.table) !== '' && typeof createdAt === 'number' && Number.isFinite(createdAt) && createdAt > 0;
}

/** Preference labels, matching the billing page rules (defaults are omitted). */
export function itemPrefs(item: RawOrderItem): string[] {
  const prefs: string[] = [];
  const ice = str(item.ice);
  const sugar = str(item.sugar);
  const size = str(item.size);
  const note = str(item.note);
  if (ice) prefs.push(ice);
  if (sugar && sugar !== 'Normal Sugar') prefs.push(sugar);
  if (size && size !== 'Regular') prefs.push(size);
  if (note) prefs.push(note);
  if (prefs.length === 0) {
    const spec = str(item.spec);
    if (spec && spec !== 'Standard') {
      for (const p of spec.split(/\s*(?:·|,)\s*/)) if (p) prefs.push(p);
    }
  }
  return prefs;
}

function normalizeItem(raw: unknown): OrderItem | null {
  if (!isObj(raw)) return null;
  const it = raw as RawOrderItem;
  const name = str(it.name);
  if (!name) return null;
  const qty = num(it.qty) || 1;
  const price = num(it.price);
  const item: OrderItem = { name, qty, price, total: num(it.total) || price * qty, prefs: itemPrefs(it) };
  const emoji = str(it.emoji);
  if (emoji) item.emoji = emoji;   // omit instead of undefined (RTDB rejects undefined)
  return item;
}

/** RTDB may return arrays as arrays or as index-keyed objects. */
function toList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return isObj(v) ? Object.values(v) : [];
}

/** Map a raw order to the shared shape; null when invalid. */
export function normalizeOrder(raw: unknown): NormalizedOrder | null {
  if (!isValidOrder(raw)) return null;
  const items = toList(raw.items).map(normalizeItem).filter((i): i is OrderItem => i !== null);
  const total = num(raw.total) || items.reduce((s, i) => s + i.total, 0);
  return {
    orderNo: str(raw.orderNo),
    table: str(raw.table),
    total,
    createdAt: raw.createdAt as number,
    status: str(raw.status),
    items,
  };
}
