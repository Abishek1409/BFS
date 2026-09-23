# Design Document: Thermal Receipt Printing with ESC/POS

## Overview

This design extends the existing Best Fruits Stall billing system to support thermal receipt printing via ESC/POS commands. The current system uses browser print dialog with HTML/CSS rendering. The thermal printing feature will generate ESC/POS command sequences that preserve the existing preference symbol convention while being compatible with standard 80mm thermal printers.

The key design challenge is translating the current SVG-based preference symbols into ESC/POS character representations that maintain visual consistency between browser display and thermal output.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────┐
│           User Interface (index.html)                │
│  ┌──────────────┐         ┌─────────────────────┐  │
│  │ Print Button │────────>│  Print Controller   │  │
│  └──────────────┘         └──────────┬──────────┘  │
└────────────────────────────────────────┼───────────┘
                                         │
                         ┌───────────────▼──────────────┐
                         │  Print Format Selector       │
                         │  - Browser Print (existing)  │
                         │  - Thermal Print (new)       │
                         └───────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
      ┌──────────▼────────────┐                   ┌─────────────▼────────────┐
      │ HTML Receipt Generator │                   │ ESC/POS Receipt Generator│
      │    (existing)          │                   │         (new)            │
      └────────────────────────┘                   └──────────┬───────────────┘
                                                               │
                                                    ┌──────────▼───────────────┐
                                                    │  ESC/POS Command Builder │
                                                    │  - Headers               │
                                                    │  - Line items            │
                                                    │  - Preference symbols    │
                                                    │  - Totals                │
                                                    └──────────┬───────────────┘
                                                               │
                                                    ┌──────────▼───────────────┐
                                                    │  Printer Communication   │
                                                    │  - Web Serial API        │
                                                    │  - USB/Network           │
                                                    └──────────────────────────┘
```

### Preference Symbol Mapping Strategy

The current system uses SVG graphics to display four types of preference combinations:

1. **With Ice & With Sugar** → Fully filled black box (■)
2. **Without Ice & Without Sugar** → Empty outline box (□)
3. **With Ice & No Sugar** → Half-filled box (left half black)
4. **Without Ice & With Sugar** → Checkered/cross-hatched box

**ESC/POS Character Mapping:**

| Browser Display | Meaning | ESC/POS Character | Unicode | Byte Code |
|----------------|---------|-------------------|---------|-----------|
| Solid black box | With Ice + Sugar | ■ | U+25A0 | 0xFE 0x46 |
| Outline box | Without Ice + No Sugar | □ | U+25A1 | 0xFE 0x47 |
| Half-box (left filled) | With Ice + No Sugar | ◧ | U+25E7 | 0xFE 0x5E |
| Checkered box | Without Ice + Sugar | ▦ | U+25A6 | 0xFE 0x4D |

*Note: Fallback ASCII characters will be provided for printers with limited character set support.*

## Components and Interfaces

### 1. ESC/POS Receipt Generator Module

**File:** `escpos-receipt.js` (new)

**Purpose:** Generate ESC/POS command sequences for thermal printing

**Key Functions:**

```javascript
/**
 * Generates ESC/POS byte array for complete receipt
 * @param {Object} billData - Bill information
 * @param {string} billData.billNo - Bill number
 * @param {string} billData.customerName - Customer name (optional)
 * @param {Array} billData.items - Array of bill items
 * @param {number} billData.total - Grand total
 * @param {Date} billData.date - Bill date/time
 * @returns {Uint8Array} ESC/POS command sequence
 */
function generateESCPOSReceipt(billData)

/**
 * Maps preference combination to ESC/POS character
 * @param {Object} item - Bill item with ice and sugar preferences
 * @returns {Uint8Array} Character bytes for preference symbol
 */
function getPreferenceSymbol(item)

/**
 * Encodes text to appropriate character set for thermal printer
 * @param {string} text - Text to encode
 * @returns {Uint8Array} Encoded bytes
 */
function encodeText(text)
```

**ESC/POS Command Constants:**

```javascript
const ESC = 0x1B;
const GS = 0x1D;

const CMD = {
  INIT: [ESC, 0x40],                    // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],      // Center alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],        // Left alignment
  BOLD_ON: [ESC, 0x45, 0x01],           // Bold text on
  BOLD_OFF: [ESC, 0x45, 0x00],          // Bold text off
  FONT_LARGE: [GS, 0x21, 0x11],         // Double width and height
  FONT_NORMAL: [GS, 0x21, 0x00],        // Normal font
  LINE_FEED: [0x0A],                    // Line feed
  CUT_PAPER: [GS, 0x56, 0x00],          // Cut paper
  CHAR_SET_UTF8: [ESC, 0x74, 0x10]      // UTF-8 character set
};
```

### 2. Printer Communication Interface

**File:** `printer-comm.js` (new)

**Purpose:** Handle communication with thermal printer via Web Serial API

**Key Functions:**

```javascript
/**
 * Request thermal printer connection
 * @returns {Promise<SerialPort>} Connected serial port
 */
async function connectThermalPrinter()

/**
 * Send ESC/POS data to printer
 * @param {Uint8Array} data - ESC/POS command sequence
 * @returns {Promise<void>}
 */
async function sendToPrinter(data)

/**
 * Check printer status
 * @returns {Promise<Object>} Printer status information
 */
async function getPrinterStatus()
```

### 3. Print Controller Enhancement

**File:** Modifications to `index.html`

**Purpose:** Add thermal printing option alongside existing browser print

**UI Changes:**

Add a print method selector in the bill panel:
- Radio buttons or dropdown to choose "Browser Print" vs "Thermal Print"
- Store user preference in localStorage
- Show printer connection status indicator

**Modified printBill() function:**

```javascript
function printBill() {
  if (billItems.length === 0) {
    alert('Add at least one item before printing!');
    return;
  }

  const printMethod = getPrintMethod(); // 'browser' or 'thermal'
  
  if (printMethod === 'thermal') {
    printThermalReceipt();
  } else {
    printBrowserReceipt(); // existing implementation
  }
}
```

## Data Models

### Bill Data Structure (existing, used by both print methods)

```javascript
{
  billNo: string,           // e.g., "001"
  customerName: string,     // optional
  items: [
    {
      uid: number,          // unique identifier
      name: string,         // item name
      emoji: string,        // emoji icon
      price: number,        // unit price
      qty: number,          // quantity
      ice: string|null,     // "With Ice" | "Without Ice" | null
      sugar: string|null,   // "Normal Sugar" | "Less Sugar" | "No Sugar" | null
      size: string|null,    // "Regular" | "Large" | null
      note: string,         // special notes
      total: number         // line total
    }
  ],
  subtotal: number,
  grandTotal: number,
  date: Date,
  time: Date
}
```

### ESC/POS Receipt Structure

```
┌────────────────────────────────────┐
│  [INIT, ALIGN_CENTER, BOLD_ON]     │
│  "Best Fruits Stall"               │
│  [BOLD_OFF, FONT_NORMAL]           │
│  "Fresh Juices | Shakes | Snacks"  │
│  [LINE "━━━━━━━━━━━━"]             │
│  [ALIGN_LEFT]                      │
│  "Bill: #001    Date: 23-Sep-2026" │
│  "Customer: John"  (if provided)   │
│  "Time: 14:30"                     │
│  [LINE "━━━━━━━━━━━━"]             │
│                                    │
│  [Table Header]                    │
│  "ITEM          QTY  PREF"         │
│  [LINE "- - - - - - - - - -"]     │
│                                    │
│  [For each item]                   │
│  "Mango Juice   2    ■"            │
│  "Orange Juice  1    □"            │
│  ...                               │
│                                    │
│  [LINE "━━━━━━━━━━━━"]             │
│  "TOTAL:              ₹150.00"     │
│  [LINE "━━━━━━━━━━━━"]             │
│  [ALIGN_CENTER]                    │
│  "Thank you!"                      │
│  "Stay Fresh | Stay Healthy"       │
│  [LINE_FEED x 3]                   │
│  [CUT_PAPER]                       │
└────────────────────────────────────┘
```

## Error Handling

### Printer Connection Errors

| Error Condition | User Message | Recovery Action |
|----------------|--------------|-----------------|
| No printer connected | "Please connect thermal printer" | Show connection button |
| Connection refused | "Printer not responding" | Retry with timeout |
| Permission denied | "Allow printer access in browser" | Show browser permission instructions |
| Printer offline | "Printer is offline" | Check printer power and cable |
| Paper out | "Printer out of paper" | Alert operator |

### Character Encoding Fallbacks

If the printer doesn't support Unicode box-drawing characters:

| Primary Symbol | Fallback ASCII | Meaning |
|---------------|----------------|---------|
| ■ (U+25A0) | `[X]` | With Ice + Sugar |
| □ (U+25A1) | `[ ]` | Without Ice + No Sugar |
| ◧ (U+25E7) | `[/]` | With Ice + No Sugar |
| ▦ (U+25A6) | `[#]` | Without Ice + Sugar |

**Detection Strategy:**
- Attempt to print test pattern during initial connection
- If box characters don't render, switch to ASCII fallback mode
- Store printer capability in localStorage for future sessions

## Testing Strategy

### Unit Tests

1. **Preference Symbol Mapping Tests**
   - Test all four ice/sugar combinations map to correct symbols
   - Verify fallback ASCII characters when Unicode unavailable
   - Test items without preferences show no symbol

2. **ESC/POS Command Generation Tests**
   - Verify command sequences for header, items, totals, footer
   - Test line width calculations (80mm = ~48 characters)
   - Verify text encoding for special characters (₹, emoji)

3. **Data Format Tests**
   - Test receipt generation with minimum data (bill number only)
   - Test receipt with full data (all optional fields)
   - Test edge cases (very long item names, large quantities)

### Integration Tests

1. **Print Method Selection**
   - Toggle between browser and thermal printing
   - Verify preference persists across sessions
   - Test default behavior (browser print)

2. **Full Print Flow**
   - Connect printer → Generate receipt → Send to printer → Verify output
   - Test with multiple bill items
   - Verify symbols print correctly on thermal paper

### Manual Testing

1. **Visual Verification**
   - Compare browser-printed and thermal-printed receipts side-by-side
   - Verify preference symbols match exactly
   - Check receipt readability and formatting

2. **Hardware Compatibility**
   - Test with multiple thermal printer models
   - Verify 80mm paper width compatibility
   - Test USB and network printer connections

3. **Error Scenario Testing**
   - Disconnect printer mid-print
   - Out of paper scenario
   - Invalid character encoding

## Implementation Notes

### Browser Compatibility

- **Web Serial API** required for thermal printer communication
- Supported in Chrome 89+, Edge 89+
- **Not supported** in Firefox, Safari
- Show compatibility warning for unsupported browsers

### Performance Considerations

- ESC/POS generation should complete in < 100ms for typical bills
- Printer communication timeout: 5 seconds
- Buffer print jobs if printer is busy
- Maximum receipt length: 500 lines (thermal paper roll capacity)

### Security Considerations

- Web Serial API requires user gesture (button click) to request permissions
- No sensitive data stored in print buffer
- Clear print queue on page unload
- Sanitize customer names and notes to prevent command injection

### Accessibility

- Provide visual and auditory feedback for print status
- Ensure keyboard navigation for print method selection
- Screen reader announcements for printer connection status

## Migration Path

### Phase 1: Add Thermal Print Infrastructure
- Implement ESC/POS generator module
- Add printer communication layer
- Unit tests for core functionality

### Phase 2: UI Integration
- Add print method selector to bill panel
- Implement printer connection flow
- Visual feedback and error handling

### Phase 3: Preference Symbol Preservation
- Implement symbol mapping logic
- Test all four ice/sugar combinations
- Verify thermal output matches browser display

### Phase 4: Testing and Refinement
- Manual testing with physical printers
- Adjust formatting based on real-world output
- Document supported printer models

## Dependencies

**New:**
- Web Serial API (browser native)
- No external libraries required

**Existing:**
- Browser print API (window.print)
- localStorage for preferences
- IndexedDB for bill history (billHistory.js)

## Future Enhancements

1. **Network Printer Support**: Add ESC/POS over network protocol (port 9100)
2. **Receipt Templates**: Allow customization of header/footer text
3. **QR Code Integration**: Add QR code for digital receipt retrieval
4. **Multiple Language Support**: Print receipts in local language
5. **Print Preview**: Show thermal receipt preview before printing
