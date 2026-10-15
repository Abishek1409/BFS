// Display formatting helpers.

/** Elapsed time since `from` as "45s", "6m 05s" or "1h 12m". */
export function elapsed(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Rupee amount, e.g. "₹2,340". Non-finite values show "—". */
export function money(v: number | null | undefined): string {
  return typeof v === 'number' && Number.isFinite(v) ? `₹${inr.format(v)}` : '—';
}

/** "QR-LX2ABC-K9F" → "K9F"; other formats keep their last 4 characters. */
export function shortOrderNo(orderNo: string): string {
  const parts = String(orderNo).split('-').filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 1];
  return String(orderNo).slice(-4);
}
