# Design Document — Bill History Storage

## Overview

A single plain JavaScript file (`billHistory.js`) exposes four functions for storing and retrieving bill records using the browser's native IndexedDB API. The module is loaded via a `<script>` tag in `index.html` and attaches its API to `window.BillHistory` so the existing inline script can call it without any module bundler.

No third-party library is used — the existing project has no Dexie dependency and adding one just to wrap four IDB calls would be unnecessary weight. Plain IDB is verbose but keeps the file fully self-contained with zero install steps.

---

## Architecture

```
index.html (inline <script>)
    │
    │  window.BillHistory.saveBillRecord(billNo, amount)
    │  window.BillHistory.getAllBillRecords()
    │  window.BillHistory.getBillRecordsByDateRange(start, end)
    │  window.BillHistory.downloadBillHistory(mode, period)
    ▼
billHistory.js
    │
    │  opens / reuses one IDBDatabase connection
    ▼
IndexedDB: "BFSBillHistory"  (v1)
    └── object store: "bills"
            keyPath: "billNo"
            (no extra indexes needed — full scan is fine for a small local dataset)
```

The module initialises the DB once on load and caches the connection. All four public functions wait for that connection before operating.

---

## Components and Interfaces

### DB initialisation (`_getDB`)

- Opens `BFSBillHistory` at version `1`.
- `onupgradeneeded`: creates the `bills` object store with `keyPath: "billNo"`.
- Returns a `Promise<IDBDatabase>` that resolves to the cached connection on every call after the first.

### `saveBillRecord(billNo, amount) → Promise<void>`

- Validates: `billNo` must be a non-empty string; `amount` must be a finite number.
- Builds the record: `{ billNo, amount, date, time }` where date/time are derived from `new Date()`.
- Uses `IDBObjectStore.put()` (upsert semantics — satisfies Req 2.4).

### `getAllBillRecords() → Promise<BillRecord[]>`

- Opens a readonly transaction on `bills`, uses `getAll()` for simplicity.
- Sorts the result array by parsed date+time descending before resolving.

### `getBillRecordsByDateRange(startDate, endDate) → Promise<BillRecord[]>`

- Validates both params as `DD-MM-YYYY`.
- Calls `getAllBillRecords()` internally, then filters by date range.
- Re-uses the same descending sort already applied by `getAllBillRecords()`.

### `downloadBillHistory(mode, period) → Promise<void>`

- `mode = "day"` → `period` is `DD-MM-YYYY`. Calls `getBillRecordsByDateRange(period, period)`.
- `mode = "month"` → `period` is `MM-YYYY`. Derives first/last day of that month, calls `getBillRecordsByDateRange`.
- Serialises the result as `JSON.stringify(records, null, 2)`.
- Creates a `Blob` with `type: "application/json"`, creates a temporary anchor with `download` attribute, clicks it, then revokes the object URL.
- Filename: `bills-DD-MM-YYYY.json` (day) or `bills-MM-YYYY.json` (month).

---

## Data Models

```js
// BillRecord shape stored in IndexedDB
{
  billNo: string,       // e.g. "001"  — primary key
  amount: number,       // e.g. 135.00
  date:   string,       // "DD-MM-YYYY"
  time:   string        // "HH:MM"  (24-hour)
}
```

Date/time helpers (internal):

```js
function _formatDate(d) {
  // returns "DD-MM-YYYY"
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function _formatTime(d) {
  // returns "HH:MM"
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function _parseDate(str) {
  // "DD-MM-YYYY" → Date (midnight local)
  const [dd, mm, yyyy] = str.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}
```

Comparison for sort / range filtering is done by converting `DD-MM-YYYY` strings to `YYYYMMDD` integers (fast, no library needed):

```js
function _dateKey(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('-');
  return parseInt(`${yyyy}${mm}${dd}`, 10);
}
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| IDB not supported | `_getDB()` rejects; all public functions propagate the rejection |
| DB open fails | `_getDB()` rejects with the IDB error event |
| Invalid `billNo` (empty/non-string) | `saveBillRecord` rejects with `"billNo must be a non-empty string"` |
| Invalid `amount` (non-finite) | `saveBillRecord` rejects with `"amount must be a finite number"` |
| Invalid date format | `getBillRecordsByDateRange` / `downloadBillHistory` reject with `"Invalid date format, expected DD-MM-YYYY"` |
| IDB transaction error | The relevant function rejects with the IDB transaction error |

All rejections return `Error` objects so callers can `.catch(e => console.error(e.message))`.

---

## Integration with Existing `printBill()`

The caller adds two lines inside the existing `printBill()` function in `index.html`, right after the bill number and amount are known and before (or after) the print window opens:

```js
// inside printBill(), after computing grandTotal
const billNo = document.getElementById('billNoInput').value;
const amount = parseFloat(document.getElementById('grandTotal').textContent.replace(/[^\d.]/g, ''));
window.BillHistory.saveBillRecord(billNo, amount)
  .catch(err => console.error('Bill save failed:', err));
```

The `<script>` tag for `billHistory.js` must appear **before** the inline script block in `index.html`.

---

## Testing Strategy

Manual smoke tests (no automated test framework exists in this project):

1. Open the app, add items, click Print Bill → open DevTools → Application → IndexedDB → BFSBillHistory → bills. Confirm record appears with correct 4 fields.
2. Call `window.BillHistory.getAllBillRecords()` in the console. Confirm newest bill is first.
3. Call `window.BillHistory.getBillRecordsByDateRange("01-08-2026", "31-08-2026")` and verify filtered results.
4. Call `window.BillHistory.downloadBillHistory("day", "16-08-2026")` — confirm a `.json` file downloads.
5. Call `window.BillHistory.downloadBillHistory("month", "08-2026")` — confirm a `.json` file downloads with all records for the month.
6. Call `window.BillHistory.saveBillRecord("", 50)` — confirm rejection is logged.
