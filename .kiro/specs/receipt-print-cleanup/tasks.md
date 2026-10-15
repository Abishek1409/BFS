# Implementation Plan

- [x] 1. Fix Customer_Receipt column alignment in escpos-receipt.js




- [x] 1.1 Correct currency measurement and column widths


  - Change `formatCurrencyValue` to return `'Rs.' + amount.toFixed(2)` so measured length equals printed length
  - Set `CUSTOMER_RECEIPT_COLS` to ITEM 19, QTY 5, PRICE 11, TOTAL 13 (sum 48)
  - _Requirements: 2.1, 2.2, 2.3, 2.5_


- [x] 1.2 Right-align the SUBTOTAL line

  - Build the line as `padText(label + ' ' + value, PAPER_WIDTH_80MM, 'right')` in `generateCustomerReceipt`
  - _Requirements: 2.4_

- [x] 2. Add emphasised shop title and bill number to both documents






- [x] 2.1 Add ESC/POS commands and shared byte builders

  - Add `DOUBLE_STRIKE_ON`, `DOUBLE_STRIKE_OFF` and `FONT_XLARGE` to `CMD`
  - Implement `buildShopTitle()` (3x bold double-strike initials B, F, S; 2x remaining letters; centred)
  - Implement `buildBillNumber(billNo)` (2x bold double-strike, centred, truncated to 24 characters)
  - Implement `buildDateTimeLine(date)` (single line of at most 48 characters)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_


- [x] 2.2 Use the builders in generateCustomerReceipt and generateKitchenTicket

  - Replace the existing title block and the `Bill: #... Date: ...` line in both generators
  - Keep the tagline, customer name line (truncated to 48 characters) and all existing item, total and footer output
  - _Requirements: 3.1, 3.2, 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Warn when a printer is configured for direct (non print server) mode




- [x] 3.1 Add warnDirectPrinter in unified-printer-comm.js


  - Show `showWarningToast` once per printer per page load when `isLocalServer` is false, without including the IP in the message
  - Fall back to `console.warn` when `showWarningToast` is not defined
  - Call it at the start of the direct branch in `sendToPosiflow` and before the fetch in `sendToWiFiPrinter`; sending behaviour is unchanged
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 4. Verify with tests in test/dual-printer.test.js






- [x] 4.1 Add alignment and emphasis tests

  - Assert normal-size customer receipt lines are at most 48 characters and QTY, PRICE and TOTAL end at the same index on the header and item rows
  - Assert a price of 1250 renders `Rs.1250.00` untruncated
  - Assert both documents contain `GS ! 0x22` before the title initials and `ESC E 1`, `ESC G 1`, `GS ! 0x11` before the bill number
  - Run `node --test test/dual-printer.test.js` and confirm existing tests still pass
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_


- [x] 4.2 Add direct-mode warning test





  - In the existing `vm` context, stub `showWarningToast`, configure a non-local IP, call `sendToPosiflow`, and assert one warning; assert none for `localhost:3000`
  - _Requirements: 1.3, 1.4_
