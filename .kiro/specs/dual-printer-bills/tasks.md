# Implementation Plan

- [x] 1. Organize project files into documents folder






  - Create documents folder in project root
  - Move all markdown documentation files to documents folder
  - Move all test HTML files to documents folder
  - Move all test JavaScript files to documents folder
  - Verify all files moved successfully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement customer receipt generation for Printer 1




  - [x] 2.1 Create generateCustomerReceipt() function in escpos-receipt.js


    - Accept billData parameter with items array
    - Generate ESC/POS header with business name and branding
    - Add bill number, customer name, date, and time metadata
    - Create itemized table with columns: ITEM, QTY, PRICE, TOTAL
    - Format each item row with name, quantity, unit price, and line total
    - Include item specifications (ice, sugar, size, notes) as sub-lines
    - Calculate and display subtotal
    - Calculate and display grand total with emphasis
    - Add footer with thank you message
    - Return Uint8Array of ESC/POS commands
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


  - [x] 2.2 Implement receipt formatting helpers

    - Create formatLineWithTotal() to align item, qty, price, and total
    - Create formatCurrencyValue() to handle rupee display
    - Create formatItemRow() to generate complete item line with specs
    - Add column width constants for 80mm thermal paper
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Refactor kitchen ticket generation for Printer 2




  - [x] 3.1 Rename generateESCPOSReceipt() to generateKitchenTicket()


    - Update function name in escpos-receipt.js
    - Preserve all existing functionality
    - Maintain preference symbol display logic
    - Keep simplified format without prices
    - Ensure backward compatibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify kitchen ticket format preservation


    - Test preference symbol generation (I, II, III, IIII)
    - Verify quantity display without pricing
    - Confirm item names and sizes display correctly
    - Test with multiple items
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Update print handler in index.html




  - [x] 4.1 Implement printDualFormats() function


    - Accept customerReceipt and kitchenTicket parameters
    - Check printer1 configuration and send customer receipt
    - Check printer2 configuration and send kitchen ticket
    - Execute both print jobs in parallel using Promise.all()
    - Return results object with success status for each printer
    - Handle partial success scenarios (one printer fails)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Update printBill() function


    - Collect bill data from UI (items, billNo, customerName)
    - Calculate subtotal and grand total
    - Call generateCustomerReceipt() with bill data
    - Call generateKitchenTicket() with bill data
    - Call printDualFormats() with both receipts
    - Handle print results and display appropriate toast messages
    - Save to bill history only on successful print
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.3 Implement error handling for print failures


    - Add handlePrintResults() function to process dual print results
    - Display error toast when both printers fail
    - Display warning toast when Printer 1 fails (customer receipt)
    - Display warning toast when Printer 2 fails (kitchen ticket)
    - Add retry buttons to error toasts
    - Implement retry logic for individual printers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Update printer configuration and status display




  - [x] 5.1 Add printer role labels to configuration UI


    - Update printer1 label to "Printer 1 (Customer Receipts)"
    - Update printer2 label to "Printer 2 (Kitchen Tickets)"
    - Add helper text explaining each printer's role
    - Update status display to show printer roles
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Implement single-printer fallback behavior


    - If only Printer 1 configured, send customer receipt only
    - If only Printer 2 configured, send kitchen ticket only
    - Display appropriate warning if only one printer configured
    - Update UI to indicate which format will print
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Update bill history to record print format





  - Modify saveBillRecord() calls to include formatType parameter
  - Add formatType field to bill history records ("customer", "kitchen", "both")
  - Update bill history display to show which format was printed
  - Ensure backward compatibility with existing history records
  - _Requirements: 2.5, 3.5_

- [ ] 7. Verify and test complete dual-printer workflow









  - Test customer receipt format with all fields populated
  - Test kitchen ticket format matches existing output
  - Test printing to both printers simultaneously
  - Test single-printer configurations (Printer 1 only, Printer 2 only)
  - Test error scenarios (one fails, both fail)
  - Test retry functionality for failed printers
  - Verify file organization is complete
  - Test that documentation is accessible in new location
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
