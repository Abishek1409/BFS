# Implementation Plan

- [x] 1. Create `billHistory.js` with IndexedDB setup and core helper utilities





  - Create the file with the `_getDB()` function that opens/creates `BFSBillHistory` database (v1) with a `bills` object store keyed on `billNo`
  - Implement the `_formatDate`, `_formatTime`, `_parseDate`, and `_dateKey` internal helpers
  - Cache the DB connection so all subsequent calls reuse the same open connection
  - _Requirements: 1.1, 1.2, 1.3, 6.3, 6.4_

- [x] 2. Implement `saveBillRecord` and expose via `window.BillHistory`





  - Write `saveBillRecord(billNo, amount)` that validates inputs, auto-generates date/time, and calls `IDBObjectStore.put()` (upsert)
  - Attach `saveBillRecord` to `window.BillHistory`
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Implement `getAllBillRecords` and `getBillRecordsByDateRange`





  - Write `getAllBillRecords()` using `getAll()` on a readonly transaction, then sort descending by date+time using `_dateKey`
  - Write `getBillRecordsByDateRange(startDate, endDate)` with `DD-MM-YYYY` validation, filtering, and reuse of `getAllBillRecords()`
  - Attach both to `window.BillHistory`
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Implement `downloadBillHistory` and wire up all exports





  - Write `downloadBillHistory(mode, period)` supporting `"day"` (`DD-MM-YYYY`) and `"month"` (`MM-YYYY`) modes
  - For month mode, derive the first and last day of the month and delegate to `getBillRecordsByDateRange`
  - Serialise records to JSON, create a `Blob`, trigger anchor download, revoke object URL
  - Attach to `window.BillHistory` and confirm all four functions are on the global object
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

- [x] 5. Integrate `billHistory.js` into `index.html`





  - Add `<script src="billHistory.js"></script>` before the existing inline `<script>` block
  - Inside the existing `printBill()` function, add `window.BillHistory.saveBillRecord(billNo, amount).catch(...)` after the grand total is computed
  - _Requirements: 6.1, 6.2, 2.1_
