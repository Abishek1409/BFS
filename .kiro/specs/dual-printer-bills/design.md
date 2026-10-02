# Design Document

## Overview

This design implements a dual-printer bill system with distinct receipt formats and file reorganization for the Best Fruits Stall system. The solution introduces two bill generation functions:
1. **Customer Receipt** (Printer 1): Itemized bill with quantities, unit prices, line totals, and grand total
2. **Kitchen Ticket** (Printer 2): Simplified order ticket with preference symbols (current format preserved)

The design maintains backward compatibility with the existing printing infrastructure while adding format differentiation based on printer designation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     index.html (UI)                      │
│  - Bill data collection                                  │
│  - Printer selection UI                                  │
│  - Print button handler                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│            escpos-receipt.js (New Module)                │
│  - generateCustomerReceipt() → Printer 1 format         │
│  - generateKitchenTicket() → Printer 2 format           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         unified-printer-comm.js (Existing)               │
│  - printToUnifiedPrinter(printerId, data)               │
│  - Handles USB/WiFi routing                              │
└─────────────────────────────────────────────────────────┘
```

### File Organization

```
project-root/
├── documents/                    # New folder for organization
│   ├── HOW-TO-AUTO-START.txt
│   ├── NO-DAILY-COMMANDS.md
│   ├── POSSIFLOW-SETUP.md
│   ├── PRINTER-IP-EXPLAINED.md
│   ├── README-POSSIFLOW.md
│   ├── receipt-formatting-test-results.md
│   ├── setup-autostart.md
│   ├── SIMPLE-SETUP-GUIDE.md
│   ├── START-HERE.md
│   ├── SYMBOL_VALIDATION_SUMMARY.md
│   ├── UNIFIED-PRINTER-SETUP.md
│   ├── VISUAL-GUIDE.md
│   ├── WIFI-PRINTER-SETUP.md
│   ├── test-bill-history-integration.html
│   ├── test-browser-compatibility.html
│   ├── test-preference-symbols.html
│   ├── test-receipt-formatting.html
│   ├── test-symbols-simple.js
│   ├── validate-receipt-consistency.js
│   └── validate-symbols.js
├── escpos-receipt.js            # Updated with dual formats
├── unified-printer-comm.js      # Existing (no changes)
└── index.html                   # Updated print handlers
```

## Components and Interfaces

### 1. Receipt Generation Module (escpos-receipt.js)

#### New Function: generateCustomerReceipt()

**Purpose**: Generate itemized customer receipt for Printer 1

**Signature**:
```javascript
function generateCustomerReceipt(billData)
```

**Input** (billData object):
```javascript
{
  billNo: string,
  customerName: string (optional),
  date: Date,
  items: [
    {
      name: string,        // Full item name
      baseName: string,    // Base product name
      qty: number,         // Quantity
      price: number,       // Unit price
      total: number,       // Line total (qty × price)
      ice: string,         // Ice preference
      sugar: string,       // Sugar preference
      size: string,        // Size
      note: string         // Special notes
    }
  ],
  subtotal: number,
  grandTotal: number
}
```

**Output**: Uint8Array (ESC/POS commands)

**Receipt Format**:
```
================================================
          BEST FRUITS STALL
     Fresh Juices | Shakes | Snacks
================================================
Bill: #123                  Date: 02-Oct-2026
Customer: John Doe          Time: 14:30
================================================

ITEM                      QTY    PRICE    TOTAL
------------------------------------------------
Watermelon Juice            2   ₹40.00   ₹80.00
  (With Ice, Less Sugar, Large)

Badham Milk                 1   ₹30.00   ₹30.00
  (With Ice, Normal Sugar)

------------------------------------------------
                        SUBTOTAL:      ₹110.00
================================================
                      GRAND TOTAL:      ₹110.00
================================================

           Thank you for your visit!
         Stay Fresh | Stay Healthy

================================================
```

#### Updated Function: generateKitchenTicket()

**Purpose**: Generate simplified kitchen order ticket (Printer 2) - preserves existing format

**Signature**:
```javascript
function generateKitchenTicket(billData)
```

**Receipt Format** (existing, with preference symbols):
```
================================================
          BEST FRUITS STALL
     Fresh Juices | Shakes | Snacks
================================================
Bill: #123                  Date: 02-Oct-2026
Time: 14:30
================================================

ITEM                      QTY          PREF
------------------------------------------------
Watermelon Juice            2            I
  Large

Badham Milk                 1            I

------------------------------------------------

           Thank you!
         Stay Fresh | Stay Healthy

================================================
```

### 2. Print Handler Updates (index.html)

#### Updated Function: printBill()

**Current Implementation**:
```javascript
async function printBill() {
  // Generates one format and sends to both printers
  const escposData = generateESCPOSReceipt(billData);
  await printToBothPrinters(escposData);
}
```

**New Implementation**:
```javascript
async function printBill() {
  const billData = collectBillData();
  
  // Generate customer receipt for Printer 1
  const customerReceipt = generateCustomerReceipt(billData);
  
  // Generate kitchen ticket for Printer 2
  const kitchenTicket = generateKitchenTicket(billData);
  
  // Print to respective printers
  const results = await printDualFormats(customerReceipt, kitchenTicket);
  
  // Handle results and save to history
  handlePrintResults(results, billData);
}
```

#### New Function: printDualFormats()

**Purpose**: Route different formats to designated printers

**Signature**:
```javascript
async function printDualFormats(customerReceipt, kitchenTicket)
```

**Implementation**:
```javascript
async function printDualFormats(customerReceipt, kitchenTicket) {
  const results = {
    printer1: { success: false, error: null },
    printer2: { success: false, error: null }
  };
  
  const promises = [];
  
  // Send customer receipt to Printer 1
  if (printerConnections.printer1.type) {
    promises.push(
      printToUnifiedPrinter('printer1', customerReceipt)
        .then(result => { results.printer1 = result; })
        .catch(error => { results.printer1 = { success: false, error: error.message }; })
    );
  }
  
  // Send kitchen ticket to Printer 2
  if (printerConnections.printer2.type) {
    promises.push(
      printToUnifiedPrinter('printer2', kitchenTicket)
        .then(result => { results.printer2 = result; })
        .catch(error => { results.printer2 = { success: false, error: error.message }; })
    );
  }
  
  await Promise.all(promises);
  return results;
}
```

## Data Models

### BillData Model

```javascript
{
  billNo: string,              // e.g., "001"
  customerName: string,        // Optional customer name
  date: Date,                  // Transaction timestamp
  items: Array<BillItem>,      // Array of ordered items
  subtotal: number,            // Sum of all item totals
  grandTotal: number,          // Final amount (currently same as subtotal)
  printMethod: string          // "thermal" or "browser"
}
```

### BillItem Model

```javascript
{
  uid: number,            // Unique identifier
  name: string,           // Full display name with specs
  baseName: string,       // Base product name
  price: number,          // Unit price (including size adjustment)
  qty: number,            // Quantity
  total: number,          // Line total (price × qty)
  ice: string,            // "With Ice" | "Without Ice"
  sugar: string,          // "Normal Sugar" | "Less Sugar" | "No Sugar"
  size: string,           // "Regular" | "Large"
  note: string,           // Special instructions
  spec: string            // Comma-separated specification string
}
```

## Error Handling

### Print Failure Scenarios

1. **Printer 1 fails, Printer 2 succeeds**:
   - Display warning toast: "Customer receipt failed, kitchen ticket printed"
   - Allow manual retry for Printer 1
   - Save bill to history with partial success note

2. **Printer 1 succeeds, Printer 2 fails**:
   - Display warning toast: "Customer receipt printed, kitchen ticket failed"
   - Allow manual retry for Printer 2
   - Bill considered successful (customer has receipt)

3. **Both printers fail**:
   - Display error toast: "Print failed for both printers"
   - Offer retry or browser print fallback
   - Do not save to history until successful print

4. **No printers configured**:
   - Disable print button
   - Show configuration prompt
   - Guide user to printer setup

### Error Toast Messages

```javascript
const ERROR_MESSAGES = {
  BOTH_FAILED: {
    title: "Print Failed",
    message: "Both printers failed to print. Check connections and try again.",
    actions: ["Retry", "Configure Printers"]
  },
  PRINTER1_FAILED: {
    title: "Customer Receipt Failed",
    message: "Kitchen ticket printed successfully, but customer receipt failed.",
    actions: ["Retry Printer 1", "Print Browser Copy"]
  },
  PRINTER2_FAILED: {
    title: "Kitchen Ticket Failed",
    message: "Customer receipt printed successfully, but kitchen ticket failed.",
    actions: ["Retry Printer 2", "Continue"]
  },
  NO_PRINTERS: {
    title: "No Printers Configured",
    message: "Please configure at least one printer before printing.",
    actions: ["Configure Now"]
  }
};
```

## Testing Strategy

### Unit Tests (Optional)

1. **Receipt Generation Tests**:
   - `test_generateCustomerReceipt_withAllFields()`: Verify all fields included
   - `test_generateCustomerReceipt_multipleItems()`: Test item iteration
   - `test_generateCustomerReceipt_calculations()`: Verify totals math
   - `test_generateKitchenTicket_preservesFormat()`: Ensure backward compatibility

2. **Print Routing Tests**:
   - `test_printDualFormats_bothConfigured()`: Both printers receive correct formats
   - `test_printDualFormats_onlyPrinter1()`: Single printer fallback
   - `test_printDualFormats_noPrinters()`: Graceful handling

### Integration Tests

1. **End-to-End Print Flow**:
   - Create bill with multiple items
   - Trigger print
   - Verify both printers receive data
   - Confirm correct formats sent to each

2. **File Organization Verification**:
   - Run organization script
   - Verify all documentation files moved
   - Confirm no files missing
   - Test that moved files are accessible

### Manual Testing Checklist

- [ ] Customer receipt includes all itemization
- [ ] Kitchen ticket excludes prices
- [ ] Preference symbols render correctly
- [ ] Totals calculate accurately
- [ ] Multiple items display properly
- [ ] Customer name appears when provided
- [ ] Bill number increments correctly
- [ ] Date/time formatted correctly
- [ ] Error handling displays appropriate messages
- [ ] Retry functionality works
- [ ] Documentation files accessible in new location
- [ ] Test files moved successfully

## Implementation Notes

### ESC/POS Command Considerations

1. **Text Alignment**: Use `CMD.ALIGN_RIGHT` for totals column
2. **Font Sizing**: Use `CMD.FONT_LARGE` for grand total emphasis
3. **Line Spacing**: Use `CMD.LINE_FEED` for section separation
4. **Paper Cutting**: Use `CMD.CUT_PAPER` only after all printing complete

### Character Encoding

- Use `encodeText()` function for special characters
- Rupee symbol (₹) → "Rs." for printer compatibility
- Preference symbols remain as text (I, II, III, IIII) for reliability

### Performance Optimization

- Generate both receipts concurrently (non-blocking)
- Parallel print dispatch to minimize wait time
- Cache bill data to avoid recalculation on retry

### Backward Compatibility

- Existing `generateESCPOSReceipt()` function renamed to `generateKitchenTicket()`
- Single-printer mode continues to work (sends customer receipt)
- No changes to printer communication layer
- Bill history format remains unchanged

## Migration Strategy

1. **Phase 1: File Organization**
   - Create `documents/` folder
   - Move documentation files
   - Move test files
   - Update any hardcoded paths

2. **Phase 2: Receipt Module Updates**
   - Implement `generateCustomerReceipt()`
   - Rename existing function to `generateKitchenTicket()`
   - Preserve all existing functionality

3. **Phase 3: Print Handler Updates**
   - Update `printBill()` function
   - Implement `printDualFormats()`
   - Add error handling logic

4. **Phase 4: Testing & Validation**
   - Test both formats independently
   - Test dual-printer printing
   - Verify file organization
   - User acceptance testing
