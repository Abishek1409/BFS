# Implementation Plan

- [x] 1. Create ESC/POS receipt generator module





  - Create `escpos-receipt.js` file with core ESC/POS command generation functionality
  - Implement ESC/POS command constants (INIT, ALIGN, BOLD, FONT, etc.)
  - Define character encoding utilities for thermal printer text
  - _Requirements: 1.1, 1.2_

- [x] 1.1 Implement preference symbol mapping logic


  - Write `getPreferenceSymbol()` function that maps ice/sugar combinations to ESC/POS characters
  - Map "With Ice + Sugar" to fully shaded block (■, U+25A0)
  - Map "Without Ice + No Sugar" to outline block (□, U+25A1)
  - Map "With Ice + No Sugar" to half-filled block (◧, U+25E7)
  - Map "Without Ice + Sugar" to checkered block (▦, U+25A6)
  - Implement ASCII fallback characters for limited character set printers
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 1.2 Build ESC/POS receipt structure generator


  - Implement `generateESCPOSReceipt()` function that creates complete receipt byte array
  - Generate receipt header with business name and decorative lines
  - Format bill metadata (bill number, date, time, customer name)
  - Build item table with columns for item name, quantity, and preference symbol
  - Calculate and format totals section
  - Add footer with thank you message
  - Include paper cut command at end
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1_



- [x] 1.3 Implement text encoding for thermal printers

  - Write `encodeText()` function to convert strings to byte arrays
  - Handle UTF-8 character encoding for currency symbol (₹)
  - Implement proper byte encoding for box-drawing characters
  - Add line width calculation for 80mm thermal paper (48 characters max)
  - _Requirements: 3.6_

- [x] 2. Create printer communication module





  - Create `printer-comm.js` file for hardware communication
  - Implement Web Serial API connection management
  - Handle printer port selection and connection
  - _Requirements: 1.2, 1.4_


- [x] 2.1 Implement printer connection flow

  - Write `connectThermalPrinter()` async function using Web Serial API
  - Request serial port access with appropriate filters (thermal printer vendors)
  - Establish serial connection with correct baud rate (9600 or 115200)
  - Store connected port reference for reuse
  - _Requirements: 1.2_


- [x] 2.2 Implement data transmission to printer

  - Write `sendToPrinter()` async function to transmit ESC/POS byte array
  - Implement proper serial port write with chunking for large receipts
  - Add transmission timeout handling (5 second max)
  - Implement write confirmation and error detection
  - _Requirements: 1.2_



- [x] 2.3 Add printer status monitoring

  - Write `getPrinterStatus()` function to query printer state
  - Detect offline printer condition
  - Detect out-of-paper condition
  - Return status object with connection and readiness information
  - _Requirements: 1.4_

- [x] 3. Integrate thermal printing into existing UI





  - Modify `index.html` to add print method selection interface
  - Add printer connection status indicator
  - Update bill panel with thermal print controls
  - _Requirements: 1.1, 1.3_

- [x] 3.1 Add print method selector UI


  - Create radio button group or dropdown for "Browser Print" vs "Thermal Print" selection
  - Position selector in bill actions area near print button
  - Implement visual styling consistent with existing design
  - Store selected print method in localStorage
  - Load saved preference on page load
  - _Requirements: 1.1_

- [x] 3.2 Implement printer connection indicator


  - Add connection status display (connected/disconnected/connecting)
  - Create "Connect Printer" button when disconnected
  - Show printer model/name when connected
  - Add visual indicators (colors, icons) for connection states
  - _Requirements: 1.3, 1.4_

- [x] 3.3 Modify printBill() function for dual print support


  - Refactor existing `printBill()` to extract current browser print logic into `printBrowserReceipt()`
  - Add `getPrintMethod()` helper to retrieve selected print method
  - Implement router logic to call appropriate print function based on selection
  - Create new `printThermalReceipt()` function that uses ESC/POS generator
  - Wire thermal print function to generate ESC/POS data and send to printer
  - _Requirements: 1.1, 1.2, 4.1_
-

- [x] 4. Implement error handling and user feedback




  - Add comprehensive error handling for printer communication failures
  - Implement user-friendly error messages
  - Add success confirmation feedback
  - _Requirements: 1.3, 1.4_

- [x] 4.1 Handle printer connection errors


  - Catch and display "No printer connected" error with connection prompt
  - Handle "Connection refused" with retry option
  - Detect "Permission denied" and show browser permission instructions
  - Implement "Printer offline" detection with troubleshooting message
  - Display "Paper out" alert when detected
  - _Requirements: 1.4_

- [x] 4.2 Implement character encoding fallbacks


  - Detect printer character set capabilities during connection
  - Switch to ASCII fallback symbols if Unicode box characters unsupported
  - Store printer capability flag in localStorage
  - Map symbols: ■→[X], □→[ ], ◧→[/], ▦→[#]
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.3 Add print status feedback


  - Show loading indicator while generating receipt
  - Display "Printing..." message during transmission
  - Show success confirmation when print completes
  - Automatically dismiss success message after 3 seconds
  - _Requirements: 1.3_

- [ ] 5. Ensure symbol consistency between browser and thermal output
  - Verify preference symbols render identically in both print modes
  - Validate symbol positioning adjacent to item names
  - Test all four ice/sugar preference combinations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.2, 4.3_

- [x] 5.1 Validate preference symbol rendering






  - Test "With Ice + With Sugar" prints as ■ on thermal receipt
  - Test "Without Ice + Without Sugar" prints as □ on thermal receipt
  - Test "With Ice + No Sugar" prints as ◧ (half-filled) on thermal receipt
  - Test "Without Ice + With Sugar" prints as ▦ (checkered) on thermal receipt
  - Verify items without ice/sugar preferences show no symbol
  - Compare thermal printed symbols with browser-printed SVG symbols visually
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 4.3_

- [x] 5.2 Test receipt formatting consistency





  - Verify receipt header matches browser print layout
  - Confirm bill number, date, time positioning matches
  - Validate item table column alignment (item, quantity, preference)
  - Check totals section formatting matches browser output
  - Verify footer content is identical
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2_

- [x] 6. Browser compatibility and graceful degradation




  - Detect Web Serial API support
  - Show appropriate message for unsupported browsers
  - Fallback to browser print when thermal printing unavailable
  - _Requirements: 1.1, 1.4_

- [x] 6.1 Implement browser compatibility detection


  - Check for `navigator.serial` API availability on page load
  - Display warning message in unsupported browsers (Firefox, Safari)
  - Hide thermal print option when API unavailable
  - Automatically select browser print as default in unsupported browsers
  - Add tooltip or info message explaining browser requirements
  - _Requirements: 1.1_

- [x] 6.2 Add graceful fallback behavior


  - Catch Web Serial API errors and fallback to browser print
  - Display informative message when falling back
  - Log compatibility information for debugging
  - Ensure browser print always works as backup
  - _Requirements: 1.4_


- [x] 7. Integrate with bill history system




  - Ensure thermal-printed bills save to IndexedDB via BillHistory
  - Store print method metadata with each bill record
  - Maintain bill history functionality for both print methods
  - _Requirements: 1.1, 1.3_

- [x] 7.1 Save thermal print records to history


  - Call `BillHistory.saveBillRecord()` after successful thermal print
  - Include same bill data as browser print (billNo, amount, items)
  - Add print method indicator to saved record metadata
  - Verify thermal-printed bills appear in history drawer
  - _Requirements: 1.1, 1.3_

- [x] 7.2 Track print method in bill records


  - Add `printMethod` field to saved bill records ('browser' or 'thermal')
  - Display print method indicator in history table (optional icon)
  - Enable filtering or grouping by print method in history view (optional enhancement)
  - _Requirements: 1.3_
