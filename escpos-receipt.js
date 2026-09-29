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
  FONT_LARGE: [GS, 0x21, 0x11],         // Double width and height
  FONT_NORMAL: [GS, 0x21, 0x00],        // Normal font
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
 * Maps preference combination to ESC/POS character
 * @param {Object} item - Bill item with ice and sugar preferences
 * @returns {string} Character for preference symbol
 */
function getPreferenceSymbol(item) {
  // Only show symbol if BOTH ice AND sugar preferences are present
  if (!item.ice || !item.sugar) {
    return '';
  }

  const hasIce = item.ice === 'With Ice';
  const hasSugar = item.sugar === 'Normal Sugar';
  
  if (useASCIIFallback) {
    // ASCII fallback characters
    if (hasIce && hasSugar) {
      return '[X]'; // With Ice + Sugar
    } else if (!hasIce && !hasSugar) {
      return '[ ]'; // Without Ice + No Sugar
    } else if (hasIce && !hasSugar) {
      return '[/]'; // With Ice + No Sugar
    } else {
      return '[#]'; // Without Ice + Sugar
    }
  } else {
    // Unicode box-drawing characters
    if (hasIce && hasSugar) {
      return '■'; // U+25A0 - Fully shaded block
    } else if (!hasIce && !hasSugar) {
      return '□'; // U+25A1 - Outline block
    } else if (hasIce && !hasSugar) {
      return '◧'; // U+25E7 - Half-filled block
    } else {
      return '▦'; // U+25A6 - Checkered block
    }
  }
}

/**
 * Encodes text to appropriate character set for thermal printer
 * Converts Unicode box symbols to printer's internal character codes
 * @param {string} text - Text to encode
 * @returns {Uint8Array} Encoded bytes
 */
function encodeText(text) {
  const bytes = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // Map Unicode box symbols to printer character codes
    if (char === '■') {
      // U+25A0 BLACK SQUARE - Full filled block
      bytes.push(0xDB); // CP437: █ (full block)
    } else if (char === '□') {
      // U+25A1 WHITE SQUARE - Empty outline box
      bytes.push(0xB0); // CP437: ░ (light shade - looks like outline)
    } else if (char === '◧') {
      // U+25E7 - Half filled (left black, right white)
      bytes.push(0xDD); // CP437: ▌ (left half block)
    } else if (char === '▦') {
      // U+25A6 - Grid/matrix pattern
      bytes.push(0xB2); // CP437: ▓ (dark shade - grid pattern)
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

/**
 * Generates ESC/POS byte array for complete receipt
 * @param {Object} billData - Bill information
 * @param {string} billData.billNo - Bill number
 * @param {string} billData.customerName - Customer name (optional)
 * @param {Array} billData.items - Array of bill items
 * @param {number} billData.subtotal - Subtotal amount
 * @param {number} billData.grandTotal - Grand total
 * @param {Date} billData.date - Bill date/time
 * @returns {Uint8Array} ESC/POS command sequence
 */
function generateESCPOSReceipt(billData) {
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
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.BOLD_ON);
  addBytes(CMD.FONT_LARGE);
  addText('Best Fruits Stall');
  addLF();
  addBytes(CMD.FONT_NORMAL);
  addBytes(CMD.BOLD_OFF);
  addText('Fresh Juices | Shakes | Snacks');
  addLF();
  addBytes(CMD.ALIGN_LEFT);
  addText(createLine('-'));
  addLF();
  
  // === BILL METADATA ===
  // Bill number and date on same line
  const dateStr = billData.date ? formatDate(billData.date) : formatDate(new Date());
  const billLine = `Bill: #${billData.billNo}`.padEnd(24) + `Date: ${dateStr}`;
  addText(billLine);
  addLF();
  
  // Customer name if provided
  if (billData.customerName && billData.customerName.trim() !== '') {
    addText(`Customer: ${billData.customerName}`);
    addLF();
  }
  
  // Time
  const timeStr = billData.date ? formatTime(billData.date) : formatTime(new Date());
  addText(`Time: ${timeStr}`);
  addLF();
  
  addText(createLine('-'));
  addLF();
  
  // === ITEMS TABLE ===
  addBytes(CMD.BOLD_ON);
  addText(padText('ITEM', 28) + padText('QTY', 8, 'right') + padText('PREF', 12, 'center'));
  addLF();
  addBytes(CMD.BOLD_OFF);
  addText(createLine('-'));
  addLF();
  
  // Add each item
  billData.items.forEach(item => {
    const itemName = item.name.substring(0, 26); // Truncate if too long
    const qty = item.qty.toString();
    const prefSymbol = getPreferenceSymbol(item);
    
    // Print item name and qty (normal size)
    const itemLine = padText(itemName, 28) + padText(qty, 8, 'right');
    addText(itemLine);
    
    // Print preference symbol in larger size
    if (prefSymbol) {
      addBytes(CMD.FONT_LARGE); // Make symbol bigger
      addText('  ' + prefSymbol);
      addBytes(CMD.FONT_NORMAL); // Back to normal
    }
    
    addLF();
    
    // Add item details if they exist (size, notes)
    const details = [];
    if (item.size) details.push(item.size);
    if (item.note && item.note.trim() !== '') details.push(item.note);
    
    if (details.length > 0) {
      const detailText = '  ' + details.join(' | ');
      addText(detailText.substring(0, PAPER_WIDTH_80MM));
      addLF();
    }
  });
  
  addText(createLine('='));
  addLF();
  
  // === FOOTER ===
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you!');
  addLF();
  addText('Stay Fresh | Stay Healthy');
  addLF(3);
  
  // Cut paper
  addBytes(CMD.CUT_PAPER);
  
  return new Uint8Array(buffer);
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
    generateESCPOSReceipt,
    getPreferenceSymbol,
    encodeText,
    setASCIIFallback,
    CMD,
    PAPER_WIDTH_80MM
  };
}
