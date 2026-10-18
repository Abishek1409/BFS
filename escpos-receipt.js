/**
 * ESC/POS Receipt Generator for Thermal Printers
 * Generates ESC/POS command sequences for Best Fruits Stall receipts
 */

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;

const CMD = {
  INIT: [ESC, 0x40],                    // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],      // Center alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],        // Left alignment
  ALIGN_RIGHT: [ESC, 0x61, 0x02],       // Right alignment
  BOLD_ON: [ESC, 0x45, 0x01],           // Bold text on
  BOLD_OFF: [ESC, 0x45, 0x00],          // Bold text off
  DOUBLE_STRIKE_ON: [ESC, 0x47, 0x01],  // Double-strike on (darker print)
  DOUBLE_STRIKE_OFF: [ESC, 0x47, 0x00], // Double-strike off
  FONT_LARGE: [GS, 0x21, 0x11],         // Double width and height
  FONT_TALL: [GS, 0x21, 0x01],          // Double height, normal width (medium)
  FONT_XLARGE: [GS, 0x21, 0x22],        // Triple width and height
  FONT_NORMAL: [GS, 0x21, 0x00],        // Normal font
  FONT_A: [ESC, 0x4D, 0x00],            // Standard 12x24 font (48 columns on 80mm)
  LINE_FEED: [0x0A],                    // Line feed
  CUT_PAPER: [GS, 0x56, 0x00]           // Cut paper
};

// Thermal paper specifications
const PAPER_WIDTH_80MM = 48; // 80mm paper ~48 characters

// Flag to determine if we should use ASCII fallback
let useASCIIFallback = false;

/**
 * Set ASCII fallback mode for printers with limited character set support
 * @param {boolean} useFallback - Whether to use ASCII fallback
 */
function setASCIIFallback(useFallback) {
  useASCIIFallback = useFallback;
}

/**
 * Maps preference combination to simple text symbol
 * @param {Object} item - Bill item with ice and sugar preferences
 * @returns {string} Character for preference symbol
 */
function getPreferenceSymbol(item) {
  console.log('getPreferenceSymbol called with item:', item);
  
  // Only show symbol if BOTH ice AND sugar preferences are present
  if (!item.ice || !item.sugar) {
    console.log('Missing ice or sugar:', { ice: item.ice, sugar: item.sugar });
    return '';
  }

  const hasIce = item.ice === 'With Ice';
  const hasSugar = item.sugar === 'Normal Sugar';
  
  console.log('Preferences:', { hasIce, hasSugar });
  
  // Simple text-based symbols (always work on any printer)
  if (hasIce && hasSugar) {
    return 'I'; // With Ice + Sugar
  } else if (hasIce && !hasSugar) {
    return 'II'; // With Ice + No Sugar
  } else if (!hasIce && hasSugar) {
    return 'III'; // Without Ice + Sugar
  } else {
    return 'IIII'; // Without Ice + No Sugar
  }
}

/**
 * Encodes text to appropriate character set for thermal printer
 * Converts Unicode shape symbols to printer's internal character codes
 * @param {string} text - Text to encode
 * @returns {Uint8Array} Encoded bytes
 */
function encodeText(text) {
  const bytes = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // Map Unicode shape symbols to printer character codes
    if (char === '●') {
      // CIRCLE - With Ice + With Sugar
      bytes.push(0x09); // CP437: ○ Circle (or use 0x07 for •)
    } else if (char === '■') {
      // SQUARE - With Ice + Without Sugar
      bytes.push(0xFE); // CP437: ■ Small solid square
    } else if (char === '▲') {
      // TRIANGLE - Without Ice + With Sugar
      bytes.push(0x1E); // CP437: ▲ Triangle
    } else if (char === '▦') {
      // GRID - Without Ice + Without Sugar
      bytes.push(0xB2); // CP437: ▓ Dark shade (grid pattern)
    } else if (char === '₹') {
      // Rupee symbol - most printers don't support, use Rs.
      bytes.push(82, 115, 46); // "Rs."
    } else if (code >= 0 && code <= 127) {
      // Standard ASCII
      bytes.push(code);
    } else {
      // Unknown character - skip or use space
      bytes.push(32); // space
    }
  }
  
  return new Uint8Array(bytes);
}

/**
 * Pads text to specified width with spaces
 * @param {string} text - Text to pad
 * @param {number} width - Target width
 * @param {string} align - 'left', 'right', or 'center'
 * @returns {string} Padded text
 */
function padText(text, width, align = 'left') {
  const textLength = text.length;
  
  if (textLength >= width) {
    return text.substring(0, width);
  }
  
  const padding = width - textLength;
  
  if (align === 'right') {
    return ' '.repeat(padding) + text;
  } else if (align === 'center') {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  } else {
    return text + ' '.repeat(padding);
  }
}

/**
 * Calculates remaining space on line for 80mm thermal paper
 * @param {string} usedText - Text already on the line
 * @returns {number} Remaining characters available
 */
function getRemainingLineWidth(usedText) {
  return Math.max(0, PAPER_WIDTH_80MM - usedText.length);
}

/**
 * Creates a line of repeating characters
 * @param {string} char - Character to repeat
 * @param {number} width - Line width (defaults to paper width)
 * @returns {string} Repeated character line
 */
function createLine(char = '-', width = PAPER_WIDTH_80MM) {
  return char.repeat(width);
}

/**
 * Formats currency value for display
 * @param {number} amount - Amount in currency
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return 'Rs.' + amount.toFixed(2);
}

// === CUSTOMER RECEIPT FORMATTING HELPERS ===

/**
 * Column widths for 80mm thermal paper customer receipt
 */
const CUSTOMER_RECEIPT_COLS = {
  ITEM: 19,      // Item name column
  QTY: 5,        // Quantity column
  PRICE: 11,     // Unit price column
  TOTAL: 13      // Line total column
};

/**
 * Formats currency value for customer receipts
 * @param {number} amount - Amount in currency
 * @returns {string} Formatted currency string with "Rs." prefix (printed length equals measured length)
 */
function formatCurrencyValue(amount) {
  return 'Rs.' + amount.toFixed(2);
}

/**
 * Formats a line with item, quantity, price, and total aligned properly
 * @param {string} itemName - Item name (will be truncated if too long)
 * @param {number} qty - Quantity
 * @param {number} price - Unit price
 * @param {number} total - Line total
 * @returns {string} Formatted line with aligned columns
 */
function formatLineWithTotal(itemName, qty, price, total) {
  const name = itemName.substring(0, CUSTOMER_RECEIPT_COLS.ITEM);
  const qtyStr = qty.toString();
  const priceStr = formatCurrencyValue(price);
  const totalStr = formatCurrencyValue(total);
  
  return padText(name, CUSTOMER_RECEIPT_COLS.ITEM) + 
         padText(qtyStr, CUSTOMER_RECEIPT_COLS.QTY, 'right') + 
         padText(priceStr, CUSTOMER_RECEIPT_COLS.PRICE, 'right') + 
         padText(totalStr, CUSTOMER_RECEIPT_COLS.TOTAL, 'right');
}

/**
 * Formats a complete item row with specifications
 * @param {Object} item - Bill item
 * @returns {Array<string>} Array of lines (main line + spec line if applicable)
 */
function formatItemRow(item) {
  const lines = [];
  
  // Main item line with pricing
  const mainLine = formatLineWithTotal(item.name, item.qty, item.price, item.total);
  lines.push(mainLine);
  
  // Build specification line
  const specs = [];
  if (item.ice) specs.push(item.ice);
  if (item.sugar) specs.push(item.sugar);
  if (item.size) specs.push(item.size);
  if (item.note && item.note.trim() !== '') specs.push(item.note);
  
  // Add spec line if there are specifications
  if (specs.length > 0) {
    const specText = '  (' + specs.join(', ') + ')';
    lines.push(specText.substring(0, PAPER_WIDTH_80MM));
  }
  
  return lines;
}

// === SHARED HEADER BUILDERS (used by both documents) ===

const SHOP_TITLE = 'Best Fruits Stall';
const BILL_NUMBER_MAX_CHARS = 24; // Double-width line holds 24 characters

/**
 * Resets size, bold and double-strike to normal
 * @returns {Array<number>} Command bytes
 */
function resetEmphasis() {
  return [...CMD.FONT_NORMAL, ...CMD.BOLD_OFF, ...CMD.DOUBLE_STRIKE_OFF];
}

/**
 * Builds the centred shop title: 3x initials, 2x remaining letters, bold + double-strike
 * @returns {Array<number>} ESC/POS bytes, ending with a line feed
 */
function buildShopTitle() {
  const bytes = [...CMD.ALIGN_CENTER, ...CMD.BOLD_ON, ...CMD.DOUBLE_STRIKE_ON];

  SHOP_TITLE.split(' ').forEach((word, index) => {
    if (index > 0) {
      bytes.push(...CMD.FONT_LARGE, ...encodeText(' '));
    }
    bytes.push(...CMD.FONT_XLARGE, ...encodeText(word.charAt(0)));
    bytes.push(...CMD.FONT_LARGE, ...encodeText(word.substring(1)));
  });

  bytes.push(...resetEmphasis(), ...CMD.LINE_FEED);
  return bytes;
}

/**
 * Builds the centred bill number line: 2x, bold + double-strike
 * @param {string} billNo - Bill number
 * @returns {Array<number>} ESC/POS bytes, ending with a line feed
 */
function buildBillNumber(billNo) {
  const text = `Bill #${billNo === undefined || billNo === null ? '' : billNo}`
    .substring(0, BILL_NUMBER_MAX_CHARS);

  return [
    ...CMD.ALIGN_CENTER, ...CMD.BOLD_ON, ...CMD.DOUBLE_STRIKE_ON, ...CMD.FONT_LARGE,
    ...encodeText(text),
    ...CMD.LINE_FEED,
    ...resetEmphasis()
  ];
}

const DINE_IN = 'Dine In';
const TAKE_AWAY = 'Take Away';

// Kitchen ticket items: double height, normal width (medium), 48 per line on 80mm paper
const KITCHEN_LARGE_COLS = { NAME: 34, QTY: 7, PREF: 7 };
const KITCHEN_LEFT_MARGIN_0 = [GS, 0x4C, 0x00, 0x00];    // GS L: left margin 0
const KITCHEN_PRINT_WIDTH_576 = [GS, 0x57, 0x40, 0x02];  // GS W: 576 dots (72mm)

/**
 * Builds the centred order type line (e.g. "DINE IN"), 2x and bold.
 * Returns no bytes when the bill has no order type.
 * @param {Object} billData - Bill information
 * @returns {Array<number>} ESC/POS bytes
 */
function buildOrderTypeLine(billData) {
  const label = getOrderTypeLabel(billData);
  if (!label) return [];
  // Mixed label is too long for 2x width, so print it at normal width
  const size = label.length > 24 ? [GS, 0x21, 0x01] : CMD.FONT_LARGE;
  return [
    ...CMD.ALIGN_CENTER, ...CMD.BOLD_ON, ...size,
    ...encodeText(label),
    ...CMD.LINE_FEED,
    ...resetEmphasis()
  ];
}

/**
 * Order type for the whole bill, from billData.orderType or the items
 * @param {Object} billData - Bill information
 * @returns {string} 'DINE IN', 'TAKE AWAY', 'DINE IN + TAKE AWAY' or ''
 */
function getOrderTypeLabel(billData) {
  if (billData.orderType) return String(billData.orderType).toUpperCase();
  const types = [...new Set((billData.items || []).map(i => i.orderType).filter(Boolean))];
  if (types.length === 0) return '';
  if (types.length === 1) return types[0].toUpperCase();
  return `${DINE_IN} + ${TAKE_AWAY}`.toUpperCase();
}

/**
 * Splits text into lines of at most `width` characters, breaking at spaces
 * @param {string} text - Text to wrap
 * @param {number} width - Max characters per line
 * @returns {Array<string>} Wrapped lines
 */
function wrapText(text, width) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).filter(Boolean).forEach(word => {
    while (word.length > width) {
      if (line) { lines.push(line); line = ''; }
      lines.push(word.substring(0, width));
      word = word.substring(width);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ' ' + word;
    else { lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/**
 * Builds the normal-size date and time line (max 48 characters)
 * @param {Date} [date] - Bill date, defaults to now
 * @returns {Array<number>} ESC/POS bytes, ending with a line feed
 */
function buildDateTimeLine(date) {
  const when = date || new Date();
  const line = `Date: ${formatDate(when)}   Time: ${formatTime(when)}`.substring(0, PAPER_WIDTH_80MM);
  return [...encodeText(line), ...CMD.LINE_FEED];
}

/**
 * Generates ESC/POS byte array for kitchen ticket (Printer 2)
 * Simplified format without pricing - shows preference symbols only
 * @param {Object} billData - Bill information
 * @param {string} billData.billNo - Bill number
 * @param {string} billData.customerName - Customer name (optional)
 * @param {Array} billData.items - Array of bill items
 * @param {number} billData.subtotal - Subtotal amount
 * @param {number} billData.grandTotal - Grand total
 * @param {Date} billData.date - Bill date/time
 * @returns {Uint8Array} ESC/POS command sequence
 */
function generateKitchenTicket(billData) {
  console.log('Generating ESC/POS receipt with data:', billData);
  const buffer = [];
  
  // Helper to add bytes to buffer
  const addBytes = (...bytes) => {
    bytes.forEach(b => {
      if (Array.isArray(b)) {
        buffer.push(...b);
      } else if (b instanceof Uint8Array) {
        buffer.push(...b);
      } else {
        buffer.push(b);
      }
    });
  };
  
  // Helper to add text
  const addText = (text) => {
    addBytes(encodeText(text));
  };
  
  // Helper to add line feed
  const addLF = (count = 1) => {
    for (let i = 0; i < count; i++) {
      addBytes(CMD.LINE_FEED);
    }
  };
  
  // Initialize printer, use the full 72mm print area (576 dots) with no left margin
  addBytes(CMD.INIT, CMD.FONT_A, KITCHEN_LEFT_MARGIN_0, KITCHEN_PRINT_WIDTH_576);
  
  // === HEADER (no shop title on the kitchen ticket) ===
  addBytes(buildBillNumber(billData.billNo));
  addBytes(buildOrderTypeLine(billData));
  addBytes(CMD.ALIGN_LEFT);
  addBytes(buildDateTimeLine(billData.date));
  
  // Customer name if provided
  if (billData.customerName && billData.customerName.trim() !== '') {
    addText(`Customer: ${billData.customerName}`.substring(0, PAPER_WIDTH_80MM));
    addLF();
  }
  
  addText(createLine('-'));
  addLF();
  
  // === ITEMS TABLE ===
  // Items print at double height only, so columns match the normal-width header.
  const { NAME, QTY, PREF } = KITCHEN_LARGE_COLS;
  addBytes(CMD.BOLD_ON);
  addText(padText('ITEM', NAME) + padText('QTY', QTY, 'right') + padText('PREF', PREF, 'right'));
  addLF();
  addBytes(CMD.BOLD_OFF);
  addText(createLine('-'));
  addLF();
  
  // Show the type per item only when the bill mixes dine in and take away
  const mixedTypes = new Set(billData.items.map(i => i.orderType).filter(Boolean)).size > 1;

  billData.items.forEach(item => {
    const nameLines = wrapText(item.baseName || item.name, NAME);
    const qty = item.qty.toString();
    const prefSymbol = getPreferenceSymbol(item);
    
    addBytes(CMD.BOLD_ON, CMD.FONT_TALL);
    nameLines.forEach((line, index) => {
      const row = index === 0
        ? padText(line, NAME) + padText(qty, QTY, 'right') + padText(prefSymbol, PREF, 'right')
        : line;
      addText(row);
      addLF();
    });
    addBytes(CMD.FONT_NORMAL, CMD.BOLD_OFF);
    
    // Item details (size, note, order type when mixed)
    const details = [];
    if (item.size && item.size !== 'Regular') details.push(item.size);
    if (item.note && item.note.trim() !== '') details.push(item.note);
    if (mixedTypes && item.orderType) details.push(item.orderType);
    
    if (details.length > 0) {
      wrapText(details.join(' | '), PAPER_WIDTH_80MM - 2).forEach(line => {
        addText('  ' + line);
        addLF();
      });
    }
    addText(createLine('-'));
    addLF();
  });
  
  // === FOOTER ===
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you!');
  addLF();
  addText('Stay Fresh | Stay Healthy');
  addLF(3);
  
  // Cut paper
  addBytes(CMD.CUT_PAPER);
  
  const result = new Uint8Array(buffer);
  console.log('Generated kitchen ticket ESC/POS data, size:', result.length, 'bytes');
  return result;
}

/**
 * Generates ESC/POS byte array for customer receipt with itemized pricing (Printer 1)
 * @param {Object} billData - Bill information
 * @param {string} billData.billNo - Bill number
 * @param {string} billData.customerName - Customer name (optional)
 * @param {Array} billData.items - Array of bill items with pricing
 * @param {number} billData.subtotal - Subtotal amount
 * @param {number} billData.grandTotal - Grand total
 * @param {Date} billData.date - Bill date/time
 * @returns {Uint8Array} ESC/POS command sequence for customer receipt
 */
function generateCustomerReceipt(billData) {
  console.log('Generating customer receipt with data:', billData);
  const buffer = [];
  
  // Helper to add bytes to buffer
  const addBytes = (...bytes) => {
    bytes.forEach(b => {
      if (Array.isArray(b)) {
        buffer.push(...b);
      } else if (b instanceof Uint8Array) {
        buffer.push(...b);
      } else {
        buffer.push(b);
      }
    });
  };
  
  // Helper to add text
  const addText = (text) => {
    addBytes(encodeText(text));
  };
  
  // Helper to add line feed
  const addLF = (count = 1) => {
    for (let i = 0; i < count; i++) {
      addBytes(CMD.LINE_FEED);
    }
  };
  
  // Initialize printer
  addBytes(CMD.INIT);
  
  // === HEADER ===
  addBytes(buildShopTitle());
  addBytes(CMD.ALIGN_CENTER);
  addText('Fresh Juices | Shakes | Snacks');
  addLF();
  addBytes(CMD.ALIGN_LEFT);
  addText(createLine('='));
  addLF();
  
  // === BILL METADATA ===
  addBytes(buildBillNumber(billData.billNo));
  addBytes(buildOrderTypeLine(billData));
  addBytes(CMD.ALIGN_LEFT);
  addBytes(buildDateTimeLine(billData.date));
  
  if (billData.customerName && billData.customerName.trim() !== '') {
    addText(`Customer: ${billData.customerName}`.substring(0, PAPER_WIDTH_80MM));
    addLF();
  }
  
  addText(createLine('='));
  addLF();
  addLF();
  
  // === ITEMS TABLE HEADER ===
  addBytes(CMD.BOLD_ON);
  const headerLine = padText('ITEM', CUSTOMER_RECEIPT_COLS.ITEM) + 
                     padText('QTY', CUSTOMER_RECEIPT_COLS.QTY, 'right') + 
                     padText('PRICE', CUSTOMER_RECEIPT_COLS.PRICE, 'right') + 
                     padText('TOTAL', CUSTOMER_RECEIPT_COLS.TOTAL, 'right');
  addText(headerLine);
  addLF();
  addBytes(CMD.BOLD_OFF);
  addText(createLine('-'));
  addLF();
  
  // === ITEMS ===
  billData.items.forEach(item => {
    const itemLines = formatItemRow(item);
    itemLines.forEach(line => {
      addText(line);
      addLF();
    });
  });
  
  // === TOTALS ===
  addText(createLine('-'));
  addLF();
  
  // Single total: bold, double height only (normal width), so it stays on one 48-column line
  const total = billData.grandTotal ?? billData.subtotal ?? 0;
  addBytes(CMD.BOLD_ON, CMD.FONT_TALL);
  addText(padText('TOTAL: ' + formatCurrencyValue(total), PAPER_WIDTH_80MM, 'right'));
  addLF();
  addBytes(CMD.FONT_NORMAL, CMD.BOLD_OFF);
  
  addText(createLine('='));
  addLF();
  addLF();
  
  // === FOOTER ===
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you for your visit!');
  addLF();
  addText('Stay Fresh | Stay Healthy');
  addLF();
  addLF();
  addText(createLine('='));
  addLF(3);
  
  // Cut paper
  addBytes(CMD.CUT_PAPER);
  
  const result = new Uint8Array(buffer);
  console.log('Generated customer receipt ESC/POS data, size:', result.length, 'bytes');
  return result;
}

/**
 * Formats date for receipt
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (DD-MMM-YYYY)
 */
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats time for receipt
 * @param {Date} date - Date object
 * @returns {string} Formatted time string (HH:MM)
 */
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateKitchenTicket,
    generateCustomerReceipt,
    getPreferenceSymbol,
    encodeText,
    setASCIIFallback,
    formatCurrencyValue,
    formatLineWithTotal,
    formatItemRow,
    getOrderTypeLabel,
    wrapText,
    CMD,
    PAPER_WIDTH_80MM,
    CUSTOMER_RECEIPT_COLS,
    KITCHEN_LARGE_COLS
  };
}
