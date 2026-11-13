if (!window.firebaseConfig) {
  console.error('Missing firebase-config.js; Firebase order syncing is disabled.');
} else {
  firebase.initializeApp(window.firebaseConfig);
  if (window.ShopAuth) ShopAuth.initShop(); // QR queue and live map wait for the shop sign-in
}

/* ===== MENU DATA ===== */
// Built-in seed for the Inventory on first run (Req 8.1). Live menu comes from Inventory.
// Items, prices, categories and photos live in menu-data.js (shared with order.html).
const DEFAULT_MENU = (window.BFS_MENU || []).map(i => ({ ...i, specs: i.specs.slice() }));
const CAT_ICONS = window.BFS_CAT_ICONS || { All: '🍽️' };

/* ===== STATE ===== */
let billItems   = [];
let currentItem = null;
const BILL_START_NUMBER = 100; // Bill numbers start at 100 and reset every day
let billCounter = BILL_START_NUMBER;
let activeQrOrderId = null;

/* ===== STORAGE HELPERS ===== */
function safeGetStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage read disabled or blocked:', e);
    return null;
  }
}

function safeSetStorage(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn('localStorage write disabled or blocked:', e);
  }
}

/* ===== LOCAL DATE HELPER ===== */
function getLocalTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ===== UNIFIED PRINTER MANAGEMENT (USB + WiFi) ===== */

/**
 * Update printer status UI
 */
function updatePrinterStatusUI() {
  const status = getPrintersStatus();
  
  // Update Printer 1
  const p1Dot = document.getElementById('printer1Dot');
  const p1Name = document.getElementById('printer1Name');
  const p1Status = document.getElementById('printer1Status');
  
  if (p1Dot) {
    p1Dot.className = 'printer-status-dot';
    if (status.printer1.configured && status.printer1.connected) {
      p1Dot.classList.add('connected');
    } else if (status.printer1.configured) {
      p1Dot.classList.add('configured'); // Add new class for configured but not connected
    }
  }
  // Keep the role label when updating printer name
  if (p1Name) {
    const roleSuffix = ' (Customer Receipts)';
    const baseName = status.printer1.name.replace(roleSuffix, '');
    p1Name.textContent = baseName + roleSuffix;
  }
  if (p1Status) {
    if (status.printer1.type === 'usb') {
      p1Status.textContent = status.printer1.connected ? '🔌 USB Connected' : '🔌 USB (Ready)';
    } else if (status.printer1.type === 'wifi') {
      const statusText = status.printer1.connected ? 'Connected' : 'Ready';
      p1Status.textContent = `📡 ${status.printer1.ip} (${statusText})`;
    } else {
      p1Status.textContent = 'Not configured';
    }
  }
  
  // Update Printer 2
  const p2Dot = document.getElementById('printer2Dot');
  const p2Name = document.getElementById('printer2Name');
  const p2Status = document.getElementById('printer2Status');
  
  if (p2Dot) {
    p2Dot.className = 'printer-status-dot';
    if (status.printer2.configured && status.printer2.connected) {
      p2Dot.classList.add('connected');
    } else if (status.printer2.configured) {
      p2Dot.classList.add('configured');
    }
  }
  // Keep the role label when updating printer name
  if (p2Name) {
    const roleSuffix = ' (Kitchen Tickets)';
    const baseName = status.printer2.name.replace(roleSuffix, '');
    p2Name.textContent = baseName + roleSuffix;
  }
  if (p2Status) {
    if (status.printer2.type === 'usb') {
      p2Status.textContent = status.printer2.connected ? '🔌 USB Connected' : '🔌 USB (Ready)';
    } else if (status.printer2.type === 'wifi') {
      const statusText = status.printer2.connected ? 'Connected' : 'Ready';
      p2Status.textContent = `📡 ${status.printer2.ip} (${statusText})`;
    } else {
      p2Status.textContent = 'Not configured';
    }
  }
  
  // Update configure button text based on configuration state
  const configBtn = document.querySelector('.btn-configure-printers');
  if (configBtn) {
    const hasAnyConfigured = status.printer1.configured || status.printer2.configured;
    configBtn.textContent = hasAnyConfigured ? '⚙️ Manage Printers' : '⚙️ Configure Printers';
  }

  // Update print button label to indicate which format will print
  const printBtn = document.getElementById('printBtn');
  const printBtnLabel = document.getElementById('printBtnLabel');
  if (printBtn && printBtnLabel) {
    const p1Configured = status.printer1.configured;
    const p2Configured = status.printer2.configured;

    if (p1Configured && p2Configured) {
      // Both printers configured - dual printing
      printBtnLabel.textContent = 'Print Receipt + Kitchen Ticket';
    } else if (p1Configured && !p2Configured) {
      // Only Printer 1 - customer receipt only
      printBtnLabel.textContent = 'Print Customer Receipt';
    } else if (!p1Configured && p2Configured) {
      // Only Printer 2 - kitchen ticket only
      printBtnLabel.textContent = 'Print Kitchen Ticket';
    } else {
      // No printers configured
      printBtnLabel.textContent = 'Print Receipt';
    }
  }
}

/**
 * Select printer connection type and show appropriate UI
 */
function selectPrinterType(printerId, type) {
  const num = printerId === 'printer1' ? '1' : '2';
  
  // Update toggle buttons
  const parent = document.querySelector(`#configPrinter${num}Name`).closest('div').parentElement;
  const toggleBtns = parent.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.getAttribute('data-val') === type) {
      btn.classList.add('selected');
    }
  });
  
  // Show/hide appropriate sections
  const usbSection = document.getElementById(`printer${num}UsbSection`);
  const wifiSection = document.getElementById(`printer${num}WifiSection`);
  
  if (type === 'usb') {
    if (usbSection) usbSection.style.display = 'block';
    if (wifiSection) wifiSection.style.display = 'none';
  } else if (type === 'wifi') {
    if (usbSection) usbSection.style.display = 'none';
    if (wifiSection) wifiSection.style.display = 'block';
  }
}

/**
 * Connect USB printer via UI
 */
async function connectUSBPrinterUI(printerId) {
  try {
    setPrintLoading(true, 'Connecting to USB printer...');
    
    await connectUSBPrinter(printerId);
    
    setPrintLoading(false);
    showSuccessToast('USB Printer Connected', `${printerConnections[printerId].name} is ready`);
    
  } catch (error) {
    setPrintLoading(false);
    
    if (error.message.includes('No USB printer selected')) {
      // User cancelled - no error message needed
      return;
    }
    
    showErrorToast('USB Connection Failed', error.message);
  }
}

/**
 * Test WiFi printer connection via UI
 */
async function testWiFiPrinterUI(printerId) {
  const num = printerId === 'printer1' ? '1' : '2';
  const ip = document.getElementById(`configPrinter${num}IP`).value.trim();
  const port = parseInt(document.getElementById(`configPrinter${num}Port`).value) || 9100;
  
  if (!ip) {
    showErrorToast('Invalid IP', 'Please enter a valid IP address');
    return;
  }
  
  try {
    setPrintLoading(true, 'Testing WiFi connection...');
    
    await connectWiFiPrinter(printerId, ip, port);
    
    setPrintLoading(false);
    showSuccessToast('WiFi Connection Successful', `Printer at ${ip}:${port} is ready`);
    
  } catch (error) {
    setPrintLoading(false);
    showErrorToast('WiFi Connection Failed', error.message);
  }
}

/**
 * Discover WiFi printers and fill form for specific printer
 */
async function discoverAndFillPrinter(printerId) {
  try {
    showToast({
      type: 'info',
      title: 'Discovering WiFi Printers...',
      message: 'Scanning network. This may take 10-20 seconds.',
      duration: 0
    });
    
    const printers = await discoverWiFiPrinters();
    
    // Dismiss discovery toast
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
      if (toast.textContent.includes('Discovering')) {
        dismissToast(toast);
      }
    });
    
    if (printers.length === 0) {
      showWarningToast('No WiFi Printers Found', 'Please check printers are connected to WiFi');
      return;
    }
    
    // Fill the form for the requested printer
    const num = printerId === 'printer1' ? '1' : '2';
    const printerIndex = printerId === 'printer1' ? 0 : Math.min(1, printers.length - 1);
    
    if (printers[printerIndex]) {
      document.getElementById(`configPrinter${num}IP`).value = printers[printerIndex].ip;
      document.getElementById(`configPrinter${num}Port`).value = printers[printerIndex].port;
      
      showSuccessToast('WiFi Printer Found', `Auto-filled ${printers[printerIndex].ip}`);
    }
    
  } catch (error) {
    showErrorToast('Discovery Failed', error.message);
  }
}

/**
 * Handle keyboard shortcuts for modal
 */
function handleModalKeyboard(event) {
  if (event.key === 'Escape') {
    closePrinterConfig();
  }
}

/**
 * Show printer configuration modal
 */
function showPrinterConfig() {
  // Add keyboard event listener
  document.addEventListener('keydown', handleModalKeyboard);
  
  const status = getPrintersStatus();
  
  // Load Printer 1 config
  document.getElementById('configPrinter1Name').value = status.printer1.name;
  if (status.printer1.type) {
    selectPrinterType('printer1', status.printer1.type);
    if (status.printer1.type === 'wifi') {
      document.getElementById('configPrinter1IP').value = status.printer1.ip || '';
      document.getElementById('configPrinter1Port').value = status.printer1.port;
    }
  }
  
  // Load Printer 2 config
  document.getElementById('configPrinter2Name').value = status.printer2.name;
  if (status.printer2.type) {
    selectPrinterType('printer2', status.printer2.type);
    if (status.printer2.type === 'wifi') {
      document.getElementById('configPrinter2IP').value = status.printer2.ip || '';
      document.getElementById('configPrinter2Port').value = status.printer2.port;
    }
  }
  
  document.getElementById('printerConfigOverlay').classList.add('show');
}

/**
 * Close printer configuration modal
 */
function closePrinterConfig() {
  document.getElementById('printerConfigOverlay').classList.remove('show');
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleModalKeyboard);
}

/**
 * Close printer config if clicked outside modal
 */
function closePrinterConfigIfClickedOutside(event) {
  if (event.target.id === 'printerConfigOverlay') {
    closePrinterConfig();
  }
}

/**
 * Save printer configuration
 */
function savePrinterConfiguration() {
  // Printer 1
  const p1Name = document.getElementById('configPrinter1Name').value.trim();
  const p1Type = document.querySelector('#configPrinter1Name').closest('div').parentElement.querySelector('.toggle-btn.selected')?.getAttribute('data-val');
  
  if (p1Type) {
    printerConnections.printer1.name = p1Name || 'Printer 1';
    printerConnections.printer1.type = p1Type;
    
    if (p1Type === 'wifi') {
      const p1IP = document.getElementById('configPrinter1IP').value.trim();
      const p1Port = parseInt(document.getElementById('configPrinter1Port').value) || 9100;
      printerConnections.printer1.ip = p1IP;
      printerConnections.printer1.port = p1Port;
    }
  }
  
  // Printer 2
  const p2Name = document.getElementById('configPrinter2Name').value.trim();
  const p2Type = document.querySelector('#configPrinter2Name').closest('div').parentElement.querySelector('.toggle-btn.selected')?.getAttribute('data-val');
  
  if (p2Type) {
    printerConnections.printer2.name = p2Name || 'Printer 2';
    printerConnections.printer2.type = p2Type;
    
    if (p2Type === 'wifi') {
      const p2IP = document.getElementById('configPrinter2IP').value.trim();
      const p2Port = parseInt(document.getElementById('configPrinter2Port').value) || 9100;
      printerConnections.printer2.ip = p2IP;
      printerConnections.printer2.port = p2Port;
    }
  }
  
  savePrinterConfig();
  updatePrinterStatusUI();
  closePrinterConfig();
  
  showSuccessToast('Configuration Saved', 'Printer settings have been updated');
}

/* ===== PRINT METHOD MANAGEMENT (Removed - Unified Only) ===== */
/* ===== PRINT METHOD MANAGEMENT (Removed - WiFi Only) ===== */

/* ===== TOAST NOTIFICATION SYSTEM ===== */
/**
 * Show toast notification with optional actions
 * @param {Object} options - Toast configuration
 * @param {string} options.type - 'success', 'error', 'warning', 'info'
 * @param {string} options.title - Toast title
 * @param {string} options.message - Toast message
 * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {Array} options.actions - Array of action buttons {label, onClick, primary}
 */
function showToast(options) {
  const {
    type = 'info',
    title,
    message,
    duration = 3000,
    actions = []
  } = options;

  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  // Build toast HTML
  let actionsHTML = '';
  if (actions.length > 0) {
    actionsHTML = '<div class="toast-actions">';
    actions.forEach((action, index) => {
      const btnClass = action.primary ? 'toast-btn-primary' : 'toast-btn-secondary';
      actionsHTML += `<button class="toast-btn ${btnClass}" data-action="${index}">${action.label}</button>`;
    });
    actionsHTML += '</div>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
      ${actionsHTML}
    </div>
    <button class="toast-close" aria-label="Close">×</button>
  `;

  // Add to container
  container.appendChild(toast);

  // Attach action button handlers
  actions.forEach((action, index) => {
    const btn = toast.querySelector(`[data-action="${index}"]`);
    if (btn) {
      btn.onclick = () => {
        if (action.onClick) action.onClick();
        dismissToast(toast);
      };
    }
  });

  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.onclick = () => dismissToast(toast);
  }

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - Toast element to dismiss
 */
function dismissToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  
  toast.classList.add('removing');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Show success toast
 * @param {string} title - Success title
 * @param {string} message - Success message
 */
function showSuccessToast(title, message) {
  showToast({ type: 'success', title, message, duration: 3000 });
}

/**
 * Show error toast
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {Array} actions - Optional action buttons
 */
function showErrorToast(title, message, actions = []) {
  showToast({ type: 'error', title, message, duration: 0, actions });
}

/**
 * Show warning toast
 * @param {string} title - Warning title
 * @param {string} message - Warning message
 */
function showWarningToast(title, message) {
  showToast({ type: 'warning', title, message, duration: 4000 });
}

/**
 * Show info toast
 * @param {string} title - Info title
 * @param {string} message - Info message
 */
function showInfoToast(title, message) {
  showToast({ type: 'info', title, message, duration: 3000 });
}

/**
 * Show/hide print loading indicator
 * @param {boolean} show - Whether to show or hide
 * @param {string} text - Loading text
 */
function setPrintLoading(show, text = 'Generating receipt...') {
  const loadingEl = document.getElementById('printLoading');
  const loadingTextEl = document.getElementById('printLoadingText');
  const printBtn = document.getElementById('printBtn');
  
  if (!loadingEl) return;
  
  if (show) {
    loadingEl.classList.add('show');
    if (loadingTextEl) loadingTextEl.textContent = text;
    if (printBtn) printBtn.disabled = true;
  } else {
    loadingEl.classList.remove('show');
    if (printBtn) printBtn.disabled = false;
  }
}

/* ===== PRINTER CONNECTION MANAGEMENT ===== */
/**
 * Update printer status UI indicator
 * @param {string} status - 'connected', 'disconnected', or 'connecting'
 * @param {string} message - Status message to display
 */
function updatePrinterStatus(status, message) {
  const statusEl = document.getElementById('printerStatus');
  const statusTextEl = document.getElementById('printerStatusText');
  const connectBtn = document.getElementById('connectPrinterBtn');
  const settingsBtn = document.getElementById('printerSettingsBtn');
  
  if (!statusEl || !statusTextEl || !connectBtn) return;
  
  // Remove all status classes
  statusEl.classList.remove('connected', 'connecting', 'disconnected');
  
  // Add appropriate status class
  statusEl.classList.add(status);
  
  // Update status text
  statusTextEl.textContent = message;
  
  // Update button state
  if (status === 'connected') {
    connectBtn.textContent = 'Disconnect';
    connectBtn.onclick = handleDisconnectPrinter;
    // Show settings button when connected
    if (settingsBtn) settingsBtn.style.display = 'block';
  } else if (status === 'connecting') {
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;
    if (settingsBtn) settingsBtn.style.display = 'none';
  } else {
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
    connectBtn.onclick = handleConnectPrinter;
    if (settingsBtn) settingsBtn.style.display = 'none';
  }
}

/**
 * Show printer settings dialog
 */
function showPrinterSettings() {
  const currentSupport = localStorage.getItem('printerUnicodeSupport') === 'true';
  const currentMode = currentSupport ? 'Unicode' : 'ASCII';
  const currentSymbols = currentSupport ? '■ □ ◧ ▦' : '[X] [ ] [/] [#]';
  
  showToast({
    type: 'info',
    title: 'Printer Settings',
    message: `Current character set: ${currentMode}\nSymbols: ${currentSymbols}\n\nSwitch if symbols don't print correctly.`,
    duration: 0,
    actions: [
      {
        label: currentSupport ? 'Switch to ASCII' : 'Switch to Unicode',
        onClick: () => togglePrinterCharacterSet(),
        primary: true
      },
      {
        label: 'Test Print',
        onClick: () => testPrinterSymbols(),
        primary: false
      }
    ]
  });
}

/**
 * Test printer symbol rendering
 * Prints a small test pattern to verify symbol support
 */
async function testPrinterSymbols() {
  if (typeof isConnected === 'undefined' || !isConnected()) {
    showErrorToast('No Printer', 'Please connect a printer first');
    return;
  }
  
  try {
    setPrintLoading(true, 'Printing test pattern...');
    
    // Create a minimal test receipt with all symbols
    const testBillData = {
      billNo: 'TEST',
      customerName: 'Character Set Test',
      items: [
        { name: 'With Ice + Sugar', qty: 1, ice: 'With Ice', sugar: 'Normal Sugar' },
        { name: 'No Ice + No Sugar', qty: 1, ice: 'Without Ice', sugar: 'No Sugar' },
        { name: 'With Ice + No Sugar', qty: 1, ice: 'With Ice', sugar: 'No Sugar' },
        { name: 'No Ice + Sugar', qty: 1, ice: 'Without Ice', sugar: 'Normal Sugar' }
      ],
      subtotal: 0,
      grandTotal: 0,
      date: new Date()
    };
    
    const escposData = generateKitchenTicket(testBillData);
    await sendToPrinter(escposData);
    
    setPrintLoading(false);
    showSuccessToast('Test Complete', 'Check the printed symbols. If they look wrong, switch character sets.');
  } catch (error) {
    setPrintLoading(false);
    showErrorToast('Test Failed', error.message);
  }
}

/**
 * Handle printer connection request
 */
async function handleConnectPrinter() {
  // Check if Web Serial API is supported
  if (!('serial' in navigator)) {
    showErrorToast(
      'Browser Not Supported',
      'Thermal printing requires Web Serial API. Please use Chrome or Edge browser.',
      [
        {
          label: 'Learn More',
          onClick: () => window.open('https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API', '_blank'),
          primary: false
        }
      ]
    );
    return;
  }
  
  try {
    updatePrinterStatus('connecting', 'Connecting...');
    
    // Import the printer communication module
    if (typeof connectThermalPrinter === 'undefined') {
      updatePrinterStatus('disconnected', 'Disconnected');
      showErrorToast(
        'Module Not Loaded',
        'Printer communication module not loaded. Please refresh the page.',
        [
          {
            label: 'Refresh',
            onClick: () => location.reload(),
            primary: true
          }
        ]
      );
      return;
    }
    
    await connectThermalPrinter();
    
    // Check printer character set capability and store in localStorage
    await detectPrinterCharacterSet();
    
    // Get port info for display
    const portInfo = getPortInfo();
    let printerName = 'Thermal Printer';
    
    if (portInfo && portInfo.usbVendorId) {
      const vendorNames = {
        0x04b8: 'Epson',
        0x0483: 'Star',
        0x1504: 'Citizen',
        0x0416: 'Bixolon',
        0x1CB0: 'Xprinter'
      };
      printerName = vendorNames[portInfo.usbVendorId] || 'Thermal Printer';
    }
    
    updatePrinterStatus('connected', printerName + ' connected');
    showSuccessToast('Printer Connected', `${printerName} is ready to print`);
    console.log('Printer connected successfully');
    
  } catch (error) {
    console.error('Printer connection error:', error);
    
    // Log compatibility information for debugging
    console.log('Connection failure details:', {
      webSerial: 'serial' in navigator,
      browser: navigator.userAgent,
      error: error.message
    });
    
    updatePrinterStatus('disconnected', 'Disconnected');
    
    // Handle specific error types with detailed messages
    if (error.message.includes('No printer selected')) {
      // User cancelled the selection dialog - no error message needed
      return;
    } else if (error.message.includes('Permission denied') || error.message.includes('SecurityError')) {
      showErrorToast(
        'Permission Denied',
        'Browser permission to access the printer was denied. You can use browser print instead.',
        [
          {
            label: 'Retry Connection',
            onClick: () => handleConnectPrinter(),
            primary: true
          },
          {
            label: 'Use Browser Print',
            onClick: () => {
              // Switch to browser print method
              const browserRadio = document.querySelector('input[name="printMethod"][value="browser"]');
              if (browserRadio) {
                browserRadio.checked = true;
                savePrintMethod();
              }
              showInfoToast('Switched to Browser Print', 'You can now print using your browser\'s print dialog');
            },
            primary: false
          },
          {
            label: 'Help',
            onClick: () => {
              showToast({
                type: 'info',
                title: 'How to Allow Printer Access',
                message: '1. Click the lock icon in the address bar\n2. Find "Serial ports" permission\n3. Change to "Allow"\n4. Retry connection',
                duration: 0
              });
            },
            primary: false
          }
        ]
      );
    } else if (error.message.includes('Connection refused') || error.message.includes('Failed to establish')) {
      showErrorToast(
        'Connection Refused',
        'Printer is not responding. You can troubleshoot or use browser print.',
        [
          {
            label: 'Retry',
            onClick: () => handleConnectPrinter(),
            primary: true
          },
          {
            label: 'Use Browser Print',
            onClick: () => {
              // Switch to browser print method
              const browserRadio = document.querySelector('input[name="printMethod"][value="browser"]');
              if (browserRadio) {
                browserRadio.checked = true;
                savePrintMethod();
              }
              showInfoToast('Switched to Browser Print', 'You can now print using your browser\'s print dialog');
            },
            primary: false
          },
          {
            label: 'Troubleshoot',
            onClick: () => {
              showToast({
                type: 'info',
                title: 'Troubleshooting Steps',
                message: '• Check printer power\n• Verify USB connection\n• Try a different USB port\n• Restart the printer',
                duration: 0
              });
            },
            primary: false
          }
        ]
      );
    } else if (error.message.includes('not supported')) {
      // Web Serial API not supported - offer to switch to browser print
      console.warn('Web Serial API not supported, browser print remains available');
      
      showErrorToast(
        'Browser Not Supported',
        'Your browser does not support thermal printing. Browser print is still available.',
        [
          {
            label: 'Use Browser Print',
            onClick: () => {
              // Switch to browser print method
              const browserRadio = document.querySelector('input[name="printMethod"][value="browser"]');
              if (browserRadio) {
                browserRadio.checked = true;
                savePrintMethod();
              }
              showInfoToast('Switched to Browser Print', 'You can now print using your browser\'s print dialog');
            },
            primary: true
          },
          {
            label: 'Learn More',
            onClick: () => window.open('https://caniuse.com/web-serial', '_blank'),
            primary: false
          }
        ]
      );
    } else {
      // Generic connection error with fallback option
      showErrorToast(
        'Connection Failed',
        error.message || 'Failed to connect to printer. You can retry or use browser print.',
        [
          {
            label: 'Retry',
            onClick: () => handleConnectPrinter(),
            primary: true
          },
          {
            label: 'Use Browser Print',
            onClick: () => {
              // Switch to browser print method
              const browserRadio = document.querySelector('input[name="printMethod"][value="browser"]');
              if (browserRadio) {
                browserRadio.checked = true;
                savePrintMethod();
              }
              showInfoToast('Switched to Browser Print', 'You can now print using your browser\'s print dialog');
            },
            primary: false
          }
        ]
      );
    }
  }
}

/**
 * Detect printer character set capabilities
 * Tests if printer supports Unicode box-drawing characters
 */
async function detectPrinterCharacterSet() {
  try {
    // Check if we already detected capabilities
    const storedCapability = localStorage.getItem('printerUnicodeSupport');
    
    if (storedCapability !== null) {
      const supportsUnicode = storedCapability === 'true';
      if (typeof setASCIIFallback !== 'undefined') {
        setASCIIFallback(!supportsUnicode);
      }
      console.log(`Using ${supportsUnicode ? 'Unicode' : 'ASCII'} symbols for printer`);
      return;
    }
    
    // Send a test pattern to detect character set support
    // Most modern thermal printers support Unicode, but some older models don't
    try {
      // Try to get printer status which might give us hints about capabilities
      if (typeof getPrinterStatus !== 'undefined') {
        const status = await getPrinterStatus();
        
        // Check vendor - some vendors are known to support Unicode better
        const portInfo = getPortInfo();
        if (portInfo && portInfo.usbVendorId) {
          // Epson, Star, and Bixolon generally support Unicode well
          const unicodeVendors = [0x04b8, 0x0483, 0x0416];
          if (unicodeVendors.includes(portInfo.usbVendorId)) {
            localStorage.setItem('printerUnicodeSupport', 'true');
            if (typeof setASCIIFallback !== 'undefined') {
              setASCIIFallback(false);
            }
            console.log('Printer supports Unicode characters (vendor detected)');
            
            // Show info toast about character set
            showInfoToast(
              'Unicode Support Detected',
              'Printer will use enhanced symbols (■ □ ◧ ▦) for preferences'
            );
            return;
          }
        }
      }
    } catch (statusError) {
      console.warn('Could not check printer status for character set detection:', statusError);
    }
    
    // Default to Unicode support for modern printers
    // User can manually switch if symbols don't print correctly
    localStorage.setItem('printerUnicodeSupport', 'true');
    if (typeof setASCIIFallback !== 'undefined') {
      setASCIIFallback(false);
    }
    console.log('Defaulting to Unicode character support');
    
    // Show info with option to switch to ASCII if needed
    showToast({
      type: 'info',
      title: 'Character Set: Unicode',
      message: 'If symbols don\'t print correctly, switch to ASCII mode in printer settings.',
      duration: 5000
    });
    
  } catch (error) {
    console.warn('Could not detect printer character set:', error);
    // Default to Unicode support
    localStorage.setItem('printerUnicodeSupport', 'true');
    if (typeof setASCIIFallback !== 'undefined') {
      setASCIIFallback(false);
    }
  }
}

/**
 * Toggle between Unicode and ASCII character sets for printer
 * Called when user manually switches character set preference
 */
function togglePrinterCharacterSet() {
  const currentSupport = localStorage.getItem('printerUnicodeSupport') === 'true';
  const newSupport = !currentSupport;
  
  localStorage.setItem('printerUnicodeSupport', newSupport.toString());
  
  if (typeof setASCIIFallback !== 'undefined') {
    setASCIIFallback(!newSupport);
  }
  
  const mode = newSupport ? 'Unicode' : 'ASCII';
  const symbols = newSupport ? '■ □ ◧ ▦' : '[X] [ ] [/] [#]';
  
  showSuccessToast(
    `Character Set: ${mode}`,
    `Printer will use ${mode} symbols: ${symbols}`
  );
  
  console.log(`Switched to ${mode} character set for printer`);
}

/**
 * Handle printer disconnection request
 */
async function handleDisconnectPrinter() {
  try {
    if (typeof disconnectPrinter !== 'undefined') {
      await disconnectPrinter();
    }
    updatePrinterStatus('disconnected', 'Disconnected');
    console.log('Printer disconnected');
  } catch (error) {
    console.error('Disconnect error:', error);
    updatePrinterStatus('disconnected', 'Disconnected');
  }
}

function checkAndResetDailyCounter() {
  const today = getLocalTodayDate();
  const storedData = safeGetStorage('bfsBillData');
  if (storedData) {
    try {
      const data = JSON.parse(storedData);
      // Counters saved before the 100 start (e.g. 4) are moved up to 100
      if (data && typeof data === 'object' && data.date === today && typeof data.counter === 'number' && data.counter >= BILL_START_NUMBER) {
        return data.counter;
      }
    } catch (e) {
      console.warn('Invalid stored bill data:', e);
    }
  }
  // New day or first time boot -> Reset bill counter to 100 for the new day
  safeSetStorage('bfsBillData', JSON.stringify({ date: today, counter: BILL_START_NUMBER }));
  return BILL_START_NUMBER;
}

function ensureTodayBillCounter() {
  let savedDate = '';
  try { savedDate = JSON.parse(safeGetStorage('bfsBillData') || '{}').date; } catch (e) {}
  if (savedDate === getLocalTodayDate()) return;
  billCounter = checkAndResetDailyCounter();
  const pad = String(billCounter);
  const billNoEl = document.getElementById('billNoInput');
  if (billNoEl) billNoEl.value = pad;
  updateHeaderBill(pad);
}

/* ===== BOOT ===== */
function init() {
  billCounter = checkAndResetDailyCounter();
  
  const pad = String(billCounter).padStart(3, '0');
  const billNoEl = document.getElementById('billNoInput');
  if (billNoEl) billNoEl.value = pad;
  updateHeaderBill(pad);
  
  // Load WiFi printer configuration
  loadPrinterConfig();
  updatePrinterStatusUI();
  
  // Load printer character set preference
  loadPrinterCharacterSetPreference();
  
  // Restore the bill that was open before switching pages
  try {
    const draft = JSON.parse(safeGetStorage('bfsDraftBill') || '[]');
    if (Array.isArray(draft)) billItems = draft;
  } catch (e) { /* ignore a broken draft */ }
  renderBill();

  initMenuFromInventory();
  initAdminAuthUI();
  renderQueue();
  if (window.ShopAuth && window.firebaseConfig) {
    setQrConnection('Shop sign-in needed', false);
    ShopAuth.whenShop(function () { connectOrderServer(); startMenuStockSync(); });
  } else {
    connectOrderServer();
    startMenuStockSync();
  }
}

/**
 * Load printer character set preference from localStorage
 */
function loadPrinterCharacterSetPreference() {
  const storedSupport = localStorage.getItem('printerUnicodeSupport');
  if (storedSupport !== null) {
    const supportsUnicode = storedSupport === 'true';
    if (typeof setASCIIFallback !== 'undefined') {
      setASCIIFallback(!supportsUnicode);
    }
    console.log(`Loaded printer character set: ${supportsUnicode ? 'Unicode' : 'ASCII'}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ===== MENU ===== */
// Live menu items, rebuilt from Inventory.getAvailable() (Req 6.5, 8.2)
let menuItems = [];
let activeMenuCat = "All";

function escMenu(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function refreshMenuItems() {
  const items = window.Inventory ? window.Inventory.getAvailable() : DEFAULT_MENU.slice();
  // Lowest to highest price inside each category (also applies to new items and the All tab)
  menuItems = window.BFS_sortMenu ? window.BFS_sortMenu(items) : items;
}

function initMenuFromInventory() {
  if (window.Inventory) {
    // Re-render menu whenever prices, items, availability, or stock change (Req 5.2)
    window.Inventory.onChange(() => {
      refreshMenuItems();
      buildCategoryTabs();
      renderMenuGrid(activeMenuCat);
    });
    window.Inventory.load(DEFAULT_MENU); // seeds on first run and fires onChange
  } else {
    console.warn('inventory.js not loaded; using built-in menu');
    refreshMenuItems();
    buildCategoryTabs();
    renderMenuGrid(activeMenuCat);
  }
}

function buildCategoryTabs() {
  const cats = ["All", ...new Set(menuItems.map(i => i.cat))];
  if (!cats.includes(activeMenuCat)) activeMenuCat = "All";
  const icons = CAT_ICONS;
  const tabsEl = document.getElementById('catTabs');
  if (!tabsEl) return; // not on the billing page
  tabsEl.innerHTML = cats.map(c =>
    `<button class="cat-tab ${c===activeMenuCat?'active':''}" data-cat="${escMenu(c)}" onclick="filterCat(this, this.dataset.cat)">${icons[c] ? icons[c] + ' ' : ''}${escMenu(c)}</button>`
  ).join('');
}

function isMenuItemOutOfStock(item) {
  return item.inStock === false;
}

/* Publishes out-of-stock item ids to Firebase (menuStock/{id}: false) so order.html can block them. */
let menuStockSyncOn = false;
function publishMenuStock() {
  if (!menuStockSyncOn || !window.Inventory || !window.firebase || !firebase.apps.length) return;
  const map = {};
  Inventory.getAll().forEach(i => { if (i.inStock === false) map[i.id] = false; });
  firebase.database().ref('menuStock').set(Object.keys(map).length ? map : null)
    .catch(e => console.warn('Could not sync stock to QR page:', e));
}
function startMenuStockSync() {
  if (menuStockSyncOn || !window.Inventory) return;
  menuStockSyncOn = true;
  Inventory.onChange(publishMenuStock);
  publishMenuStock();
  startMenuSync();
}

/* Shares the whole menu (items, prices, images, availability) through Firebase `menu/items`,
   so every billing laptop and the QR site show the same items. Last save wins. */
let menuSyncReady = false;
function uploadMenu() {
  if (!menuSyncReady) return;
  const items = {};
  Inventory.getAll().forEach(i => {
    items[i.id] = { id: i.id, name: i.name, price: i.price, cat: i.cat, img: i.img || '', emoji: i.emoji || '',
      specs: i.specs || [], available: i.available !== false, inStock: i.inStock !== false };
  });
  firebase.database().ref('menu').set({ items, updatedAt: firebase.database.ServerValue.TIMESTAMP })
    .then(() => Inventory.markUploaded())
    .catch(e => {
      console.warn('Could not save menu to Firebase:', e);
      showToast({ type: 'error', title: 'Menu not shared', message: 'Saved on this laptop only. Check internet / shop sign-in.' });
    });
}
function startMenuSync() {
  if (!window.firebase || !firebase.apps.length) return;
  Inventory.onCommit(uploadMenu); // local edits -> Firebase
  firebase.database().ref('menu/items').on('value', snap => {
    const val = snap.val();
    menuSyncReady = true;
    if (!val) { uploadMenu(); return; } // first laptop to connect seeds the shared menu
    const res = Inventory.applyRemote(Object.values(val));
    if (res.kept) uploadMenu(); // items added on this laptop while offline
  }, e => console.warn('Could not load shared menu:', e));
}

function renderMenuGrid(cat) {
  activeMenuCat = cat;
  if (!document.getElementById('menuGrid')) return; // not on the billing page
  const searchEl = document.getElementById('menuSearch');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  // While searching, look through every category so items are never hidden by the active tab
  let items = (cat === "All" || q) ? menuItems : menuItems.filter(i => i.cat === cat);
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || String(i.cat).toLowerCase().includes(q));
  if (!items.length) {
    document.getElementById('menuGrid').innerHTML = `<div class="menu-empty">${q ? `No items match "${escMenu(q)}"` : 'No items in this category yet.'}</div>`;
    return;
  }
  document.getElementById('menuGrid').innerHTML = items.map((item, idx) => {
    const out = isMenuItemOutOfStock(item); // Req 7.5
    return `
    <div class="menu-card${out ? ' out-of-stock' : ''}" id="menuCard-${item.id}" data-cat="${escMenu(item.cat)}" style="--i:${Math.min(idx, 20)}" onclick="openModal(${item.id})">
      ${out ? '<div class="out-of-stock-label">Out of stock</div>' : ''}
      ${item.img
        ? `<img class="item-photo${item.img.includes('/icons/') ? ' is-icon' : ''}" src="${escMenu(item.img)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji',textContent:this.dataset.emoji}))" data-emoji="${escMenu(item.emoji)}">`
        : `<span class="emoji">${escMenu(item.emoji)}</span>`}
      <div class="item-name">${escMenu(item.name)}</div>
      <div class="item-price">&#x20B9;${item.price}</div>
      <div class="item-cat-badge">${escMenu(item.cat)}</div>
    </div>`;
  }).join('');
  animateMenuItems(cat, q);
}

/* Plays the staggered entrance only when the visible set really changes (first load, tab switch,
   clearing search). Typing in search re-renders silently so it stays instant. */
let lastMenuIntroKey = null;
function animateMenuItems(cat, q) {
  const grid = document.getElementById('menuGrid');
  const key = q ? 'search' : 'cat:' + cat;
  if (key === lastMenuIntroKey) return;
  lastMenuIntroKey = key;
  if (q) return; // starting a search: no replay
  grid.classList.remove('intro');
  void grid.offsetWidth; // restart the animation
  grid.classList.add('intro');
  clearTimeout(animateMenuItems.t);
  animateMenuItems.t = setTimeout(() => grid.classList.remove('intro'), 900);
}

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderMenuGrid(cat);
}

/* ===== MODAL ===== */
function openModal(id) {
  // Lookup from live Inventory so new prices apply to new bills (Req 5.4)
  currentItem = menuItems.find(i => i.id === id);
  if (!currentItem) return;
  document.getElementById('modalItemName').textContent  = ((currentItem.emoji || '') + ' ' + currentItem.name).trim();
  document.getElementById('modalItemPrice').textContent = '&#x20B9;' + currentItem.price + ' each';
  document.getElementById('modalItemPrice').innerHTML   = '&#x20B9;' + currentItem.price + ' each';
  document.getElementById('modalQty').value  = 1;
  document.getElementById('modalNote').value = '';

  const s = currentItem.specs || [];
  document.getElementById('iceRow').style.display   = s.includes('ice')   ? '' : 'none';
  document.getElementById('sugarRow').style.display = s.includes('sugar') ? '' : 'none';
  document.getElementById('sizeRow').style.display  = s.includes('size')  ? '' : 'none';

  // Reset toggles to first option
  ['iceRow','sugarRow','sizeRow'].forEach(rowId => {
    const row = document.getElementById(rowId);
    const btns = row.querySelectorAll('.toggle-btn');
    btns.forEach((b,i) => b.classList.toggle('selected', i === 0));
  });
  // Default to the order type already used on this bill
  const lastType = billItems.length ? billItems[billItems.length - 1].orderType : 'Dine In';
  document.querySelectorAll('#orderTypeRow .toggle-btn')
    .forEach(b => b.classList.toggle('selected', b.dataset.val === (lastType || 'Dine In')));

  document.getElementById('itemOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('itemOverlay').classList.remove('show');
  currentItem = null;
}

const itemOverlayEl = document.getElementById('itemOverlay');
if (itemOverlayEl) itemOverlayEl.addEventListener('click', e => {
  if (e.target === itemOverlayEl) closeModal();
});

function selectToggle(btn, rowId) {
  document.getElementById(rowId).querySelectorAll('.toggle-btn')
    .forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function getToggleVal(rowId) {
  const row = document.getElementById(rowId);
  if (!row || row.style.display === 'none') return null;
  const sel = row.querySelector('.toggle-btn.selected');
  return sel ? sel.dataset.val : null;
}

function addToBill() {
  if (!currentItem) return;
  const qty  = Math.max(1, parseInt(document.getElementById('modalQty').value) || 1);
  const note = document.getElementById('modalNote').value.trim();

  const ice   = getToggleVal('iceRow');
  const sugar = getToggleVal('sugarRow');
  const size  = getToggleVal('sizeRow');
  const orderType = getToggleVal('orderTypeRow') || 'Dine In';
  const sizeExtra = (size === 'Large') ? 10 : 0;
  const unitPrice = currentItem.price + sizeExtra;

  billItems.push({
    uid: Date.now() + Math.random(),
    name:  currentItem.name,
    emoji: currentItem.emoji,
    price: unitPrice,
    qty,
    ice, sugar, size, note, orderType,
    total: unitPrice * qty
  });

  // briefly flash the menu card to show item was added
  try { flashCard(currentItem.id, qty); } catch(e){}

  renderBill();
  closeModal();
}

function flashCard(itemId, qty) {
  var el = document.getElementById('menuCard-' + itemId);
  if (!el) return;
  // add badge
  var badge = document.createElement('div');
  badge.className = 'added-badge';
  badge.textContent = 'Added ×' + qty;
  el.appendChild(badge);
  el.classList.add('just-added');
  setTimeout(function() {
    el.classList.remove('just-added');
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
  }, 900);
}

function renderBill() {
  const list     = document.getElementById('billItemsList');
  const totalsEl = document.getElementById('billTotals');
  if (!list) return; // not on the billing page
  // Keep the open bill when the cashier switches to another page and back
  safeSetStorage('bfsDraftBill', JSON.stringify(billItems));

  if (billItems.length === 0) {
    list.innerHTML = `<div class="empty-bill"><span class="icon">&#x1F6D2;</span>No items yet. Tap any menu item to add.</div>`;
    totalsEl.style.display = 'none';
    var pLabel = document.getElementById('printBtnLabel'); if (pLabel) pLabel.textContent = 'Print Bill';
    return;
  }

  list.innerHTML = billItems.map((item, idx) => {
    const parts = [];
    if (item.ice)   parts.push(item.ice);
    if (item.sugar && item.sugar !== 'Normal Sugar') parts.push(item.sugar);
    if (item.size  && item.size  !== 'Regular')      parts.push(item.size);
    if (item.note) parts.push(item.note);
    if (item.orderType === 'Take Away') parts.push('Take Away');
    const spec = parts.length ? parts.join(' &middot; ') : 'Standard';
    return `
      <div class="bill-item">
        <div class="bill-item-info">
          <div class="bill-item-name">${item.emoji} ${item.name}</div>
          <div class="bill-item-spec">${spec}</div>
        </div>
        <div class="bill-item-qty-price">
          <div class="qty-stepper">
            <button type="button" onclick="changeBillQty(${idx}, -1)" ${item.qty <= 1 ? 'disabled' : ''} aria-label="Decrease ${escMenu(item.name)}">&minus;</button>
            <span class="qty-val">${item.qty}</span>
            <button type="button" onclick="changeBillQty(${idx}, 1)" aria-label="Increase ${escMenu(item.name)}">+</button>
          </div>
          <div class="bill-item-unit">&#x20B9;${item.price} each</div>
          <div class="bill-item-total">&#x20B9;${item.total.toFixed(2)}</div>
        </div>
        <button class="bill-item-del" onclick="removeItem(${idx})" title="Remove item">&#x2715;</button>
      </div>`;
  }).join('');

  const subtotal = billItems.reduce((s,i) => s + i.total, 0);
  document.getElementById('subtotalVal').innerHTML = '&#x20B9;' + subtotal.toFixed(2);
  document.getElementById('grandTotal').innerHTML  = '&#x20B9;' + subtotal.toFixed(2);
  totalsEl.style.display = 'block';
  var totalItems = billItems.reduce(function(s,i){ return s + (i.qty||0); }, 0);
  var pLabel = document.getElementById('printBtnLabel'); if (pLabel) pLabel.textContent = 'Print Bill (' + totalItems + ' items)';
}

function removeItem(idx) {
  billItems.splice(idx, 1);
  renderBill();
}

// + / − on a bill line. Minimum is 1; use ✕ to remove the line.
function changeBillQty(idx, delta) {
  const item = billItems[idx];
  if (!item) return;
  item.qty = Math.max(1, (Number(item.qty) || 1) + delta);
  item.total = item.price * item.qty;
  renderBill();
}

// + / − in the add-item popup
function stepModalQty(delta) {
  const input = document.getElementById('modalQty');
  input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
}

function advanceBillCounter() {
  const today = getLocalTodayDate();
  const storedData = safeGetStorage('bfsBillData');
  let currentSavedDate = '';
  if (storedData) {
    try { currentSavedDate = JSON.parse(storedData).date; } catch(e) {}
  }
  if (currentSavedDate !== today) {
    // First bill of a new day
    billCounter = BILL_START_NUMBER;
  } else {
    billCounter = Math.max(BILL_START_NUMBER, billCounter + 1);
  }
  safeSetStorage('bfsBillData', JSON.stringify({ date: today, counter: billCounter }));
  const pad = String(billCounter).padStart(3, '0');
  const billNoEl = document.getElementById('billNoInput');
  if (billNoEl) billNoEl.value = pad;
  updateHeaderBill(pad);
}

function clearBill() {
  if (billItems.length > 0 && !confirm('Clear all items and start a new bill?')) return;
  billItems = [];
  const custEl = document.getElementById('customerName');
  if (custEl) custEl.value = '';
  renderBill();
}

function updateHeaderBill(val) {
  const el = document.getElementById('headerBillNo');
  if (el) el.textContent = 'Bill #' + (val || '---');
}

/* ===== ADMIN AUTH UI ===== */
let adminLockTimer = null;
let adminPendingAction = null; // runs after a successful login (e.g. open History)

function setAdminControls(active) {
  document.querySelectorAll('[data-admin-only]').forEach(el => { el.hidden = !active; });
  // "Admin login needed" notice on the History / Reports / Inventory pages
  document.querySelectorAll('[data-admin-locked]').forEach(el => { el.hidden = active; });
  const loginBtn = document.getElementById('adminLoginBtn');
  if (loginBtn) loginBtn.hidden = active;
  if (!active) {
    // Close protected views when the session ends (Req 3.3, 3.4)
    closeHistDrawer();
    closeRptDrawer();
    if (typeof closeAdminPanel === 'function') closeAdminPanel();
  }
}

function initAdminAuthUI() {
  setAdminControls(false);
  if (!window.AdminAuth) { console.warn('adminAuth.js not loaded; admin features disabled'); return; }
  AdminAuth.onChange(setAdminControls);
  AdminAuth.setLoginPrompt(showAdminLogin);
  // Validate stored token with the server before showing protected controls (Req 3.1)
  AdminAuth.validate().then(setAdminControls);
}

function showAdminLogin(onGranted) {
  adminPendingAction = typeof onGranted === 'function' ? onGranted : null;
  const err = document.getElementById('adminLoginError');
  const pw = document.getElementById('adminPassword');
  err.textContent = '';
  pw.value = '';
  document.getElementById('adminLoginOverlay').classList.add('show');
  updateAdminLockout();
  if (!pw.disabled) pw.focus();
}

function closeAdminLogin() {
  document.getElementById('adminLoginOverlay').classList.remove('show');
  if (adminLockTimer) { clearInterval(adminLockTimer); adminLockTimer = null; }
  adminPendingAction = null;
}

/** Disables the form and shows a countdown while locked out (Req 2.5). */
function updateAdminLockout() {
  const ms = window.AdminAuth ? AdminAuth.lockedForMs() : 0;
  const pw = document.getElementById('adminPassword');
  const btn = document.getElementById('adminLoginSubmit');
  const err = document.getElementById('adminLoginError');
  const locked = ms > 0;
  pw.disabled = locked;
  btn.disabled = locked;
  if (locked) {
    const s = Math.ceil(ms / 1000);
    err.textContent = `Too many attempts. Try again in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (!adminLockTimer) adminLockTimer = setInterval(updateAdminLockout, 1000);
  } else if (adminLockTimer) {
    clearInterval(adminLockTimer);
    adminLockTimer = null;
    err.textContent = '';
    pw.focus();
  }
}

function submitAdminLogin(e) {
  e.preventDefault();
  if (!window.AdminAuth) return;
  const pw = document.getElementById('adminPassword');
  const btn = document.getElementById('adminLoginSubmit');
  const err = document.getElementById('adminLoginError');
  btn.disabled = true;
  err.textContent = '';
  AdminAuth.login(pw.value).then(res => {
    btn.disabled = false;
    if (res.ok) {
      const next = adminPendingAction;
      closeAdminLogin();
      // Open the requested view, or the Admin_Panel by default (Req 2.3)
      (next || openAdminPanel)();
      return;
    }
    pw.value = '';
    err.textContent = res.error || 'Login failed'; // "Incorrect password" (Req 2.4)
    if (res.lockedForMs) updateAdminLockout();
  });
}

function adminLogout() {
  if (window.AdminAuth) AdminAuth.logout(); // fires onChange -> hides controls (Req 3.4)
  setAdminControls(false);
}

/** Gate helper: runs fn only with a valid session, else shows login (Req 3.2, 4.3). */
function withAdmin(fn) {
  if (!window.AdminAuth) return;
  AdminAuth.requireAdmin(fn);
}

function openAdminPanel() {
  withAdmin(showAdminPanelDrawer);
}

/* ===== HEADER HAMBURGER MENU ===== */
function isNavMenuOpen() {
  const menu = document.getElementById('navMenu');
  return !!menu && menu.classList.contains('open');
}

/** Opens/closes the right-side menu panel. */
function toggleNavMenu(force) {
  const menu = document.getElementById('navMenu');
  const btn = document.getElementById('navMenuBtn');
  if (!menu || !btn) return; // pages use the sidebar instead
  const open = typeof force === 'boolean' ? force : !isNavMenuOpen();
  const wasOpen = isNavMenuOpen();
  menu.classList.toggle('open', open);
  document.getElementById('navBackdrop').classList.toggle('open', open);
  menu.setAttribute('aria-hidden', String(!open));
  btn.setAttribute('aria-expanded', String(open));
  if (open) {
    const first = menu.querySelector('.nav-item:not([hidden])');
    if (first) first.focus();
  } else if (wasOpen && menu.contains(document.activeElement)) {
    btn.focus(); // return focus to the hamburger when the panel closes
  }
}

/** Closes the menu, then runs the chosen action. */
function navGo(fn) {
  toggleNavMenu(false);
  if (typeof fn === 'function') fn();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isNavMenuOpen()) toggleNavMenu(false);
});

/* ===== ADMIN PANEL DRAWER ===== */
let apListenerBound = false;

function showAdminPanelDrawer() {
  if (!window.Inventory) { showToast({ type: 'error', title: 'Inventory unavailable', message: 'inventory.js not loaded' }); return; }
  // Inventory lives on its own page now
  if (!document.getElementById('apTableBody')) { location.href = 'inventory.html'; return; }
  const drawer = document.getElementById('adminDrawer');
  if (!apListenerBound) {
    // Keep the table in sync with any Inventory change while shown
    Inventory.onChange(() => { if (!drawer || drawer.classList.contains('open')) renderAdminPanel(); });
    apListenerBound = true;
  }
  document.getElementById('apFileMsg').textContent = '';
  document.getElementById('apNewErr').textContent = '';
  renderAdminPanel();
  if (drawer) {
    drawer.classList.add('open');
    document.getElementById('adminBackdrop').classList.add('open');
  }
}

function closeAdminPanel() {
  const d = document.getElementById('adminDrawer');
  if (!d) return;
  d.classList.remove('open');
  document.getElementById('adminBackdrop').classList.remove('open');
}

/** Opens History/Reports from the panel (Req 4.1, 4.2). */
function apOpen(showFn) {
  withAdmin(() => { closeAdminPanel(); showFn(); });
}

/** Re-validates the session before every admin save (Req 3.2). */
function apGuard(action) {
  withAdmin(action);
}

function apEl(tag, props, children) {
  const el = document.createElement(tag);
  const { ariaLabel, ...rest } = props || {};
  Object.assign(el, rest);
  if (ariaLabel) el.setAttribute('aria-label', ariaLabel);
  (children || []).forEach(c => el.append(c));
  return el;
}


function renderAdminPanel() {
  const items = Inventory.getAll();
  const body = document.getElementById('apTableBody');
  body.replaceChildren();

  // Category suggestions for the new item form + category list (includes admin-added empty ones)
  const cats = Inventory.getCategories ? Inventory.getCategories() : [...new Set(items.map(i => i.cat).filter(Boolean))];
  document.getElementById('apCatList').replaceChildren(...cats.map(c => apEl('option', { value: c })));
  document.getElementById('apCatChips').replaceChildren(...cats.map(c => {
    const n = items.filter(i => i.cat === c).length;
    return apEl('span', { className: 'ap-cat-chip', textContent: `${c} (${n})` });
  }));
  apCats = cats;

  if (!items.length) {
    body.append(apEl('tr', {}, [apEl('td', { colSpan: 6, className: 'hist-empty', textContent: 'No items' })]));
    return;
  }
  items.forEach(item => body.append(apRow(item)));
}

function apRow(item) {
  const err = apEl('div', { className: 'ap-err', role: 'alert' });
  const show = res => { err.textContent = res.ok ? '' : res.error; return res.ok; };

  // Name (Req 5.1)
  const nameCell = apEl('td', {}, [`${item.emoji || ''} ${item.name}`.trim()]);

  // Price edit (Req 5.2, 5.3)
  const priceIn = apEl('input', { type: 'number', className: 'ap-num', value: String(item.price), min: '1', max: '100000', step: 'any', ariaLabel: `Price for ${item.name}` });
  const priceBtn = apEl('button', { type: 'button', className: 'ap-small-btn', textContent: 'Save' });
  const savePrice = () => apGuard(() => show(Inventory.updatePrice(item.id, priceIn.value)));
  priceBtn.onclick = savePrice;
  priceIn.onkeydown = e => { if (e.key === 'Enter') savePrice(); };
  const priceCell = apEl('td', {}, [apEl('div', { className: 'ap-cell' }, [priceIn, priceBtn]), err]);

  // Availability (Req 6.4)
  const avail = apEl('input', { type: 'checkbox', checked: item.available, ariaLabel: `${item.name} available` });
  avail.onchange = () => {
    const want = avail.checked;
    avail.checked = !want; // revert until the save succeeds
    apGuard(() => show(Inventory.setAvailable(item.id, want)));
  };

  // Category: move an item to any existing category
  const catSel = apEl('select', { className: 'ap-cat-select', ariaLabel: `Category for ${item.name}` },
    (apCats.includes(item.cat) ? apCats : [item.cat, ...apCats]).map(c => apEl('option', { value: c, textContent: c, selected: c === item.cat })));
  catSel.onchange = () => {
    const want = catSel.value;
    catSel.value = item.cat; // revert until the save succeeds
    apGuard(() => show(Inventory.updateCategory(item.id, want)));
  };

  return apEl('tr', {}, [
    nameCell,
    apEl('td', {}, [catSel]),
    priceCell,
    apEl('td', {}, [avail]),
    apEl('td', {}, apStockCell(item)),
    apEl('td', {}, [apRemoveBtn(item, show)])
  ]);
}

/** Two-step remove: first click asks "Sure?", second click within 4s deletes everywhere. */
function apRemoveBtn(item, show) {
  const btn = apEl('button', { type: 'button', className: 'ap-remove-btn', textContent: 'Remove', ariaLabel: `Remove ${item.name} from the menu` });
  let timer = null;
  btn.onclick = () => {
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm');
      btn.textContent = 'Sure? Remove';
      btn.setAttribute('aria-label', `Click again to permanently remove ${item.name}`);
      timer = setTimeout(() => {
        btn.classList.remove('confirm');
        btn.textContent = 'Remove';
        btn.setAttribute('aria-label', `Remove ${item.name} from the menu`);
      }, 4000);
      return;
    }
    clearTimeout(timer);
    apGuard(() => {
      if (show(Inventory.removeItem(item.id))) {
        showToast({ type: 'success', title: 'Item removed', message: `${item.name} removed from menu and QR page` });
      }
    });
  };
  return btn;
}

/** One-click In stock / Out of stock toggle. Also hides/blocks the item on the QR order page. */
function apStockCell(item) {
  const err = apEl('div', { className: 'ap-err', role: 'alert' });
  const out = item.inStock === false;
  const btn = apEl('button', {
    type: 'button',
    className: out ? 'ap-stock-btn is-out' : 'ap-stock-btn',
    textContent: out ? 'Out of stock' : 'In stock',
    title: out ? 'Click to mark In stock' : 'Click to mark Out of stock',
    ariaLabel: `${item.name}: ${out ? 'out of stock' : 'in stock'}. Click to change.`
  });
  btn.setAttribute('aria-pressed', String(out));
  btn.onclick = () => apGuard(() => {
    const res = Inventory.setInStock(item.id, out);
    err.textContent = res.ok ? '' : res.error;
  });
  return [btn, err];
}

let apCats = [];

/** Adds a new (empty) category; items can then be added to it or moved into it. */
function apAddCategory(e) {
  e.preventDefault();
  const err = document.getElementById('apCatErr');
  const input = document.getElementById('apNewCatName');
  apGuard(() => {
    const res = Inventory.addCategory(input.value);
    err.classList.toggle('ap-ok', res.ok);
    if (!res.ok) { err.textContent = res.error; return; }
    err.textContent = `Added category "${res.category}". Add an item to it to show it on the menu.`;
    input.value = '';
    document.getElementById('apNewCat').value = res.category;
    renderAdminPanel();
  });
}

/** New item form (Req 6.1, 6.2, 6.3). */
function apAddItem(e) {
  e.preventDefault();
  const err = document.getElementById('apNewErr');
  const val = id => document.getElementById(id).value;
  const specs = [];
  if (document.getElementById('apNewIce').checked) specs.push('ice');
  if (document.getElementById('apNewSugar').checked) specs.push('sugar');
  const fields = { name: val('apNewName'), img: apNewImg, price: val('apNewPrice'), cat: val('apNewCat'), specs };

  apGuard(() => {
    const res = Inventory.addItem(fields);
    err.classList.toggle('ap-ok', res.ok);
    if (!res.ok) { err.textContent = res.error; return; }
    err.textContent = `Added "${res.item.name}" to ${res.item.cat}`;
    ['apNewName', 'apNewPrice'].forEach(id => { document.getElementById(id).value = ''; });
    apClearNewImage();
  });
}

/* New item photo: shrunk to max 480px JPEG and stored as a data URL so it syncs with the menu. */
let apNewImg = '';
function apPickNewImage(input) {
  const err = document.getElementById('apNewErr');
  const file = input.files && input.files[0];
  if (!file) return;
  if (!/^image\//.test(file.type)) { err.textContent = 'Please choose an image file'; input.value = ''; return; }
  if (file.size > 15 * 1024 * 1024) { err.textContent = 'Image is too large (max 15 MB)'; input.value = ''; return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    apNewImg = c.toDataURL('image/jpeg', 0.8);
    const prev = document.getElementById('apNewImgPreview');
    prev.src = apNewImg;
    prev.hidden = false;
    err.textContent = '';
  };
  img.onerror = () => { URL.revokeObjectURL(url); err.textContent = 'Could not read that image'; input.value = ''; };
  img.src = url;
}
function apClearNewImage() {
  apNewImg = '';
  document.getElementById('apNewImg').value = '';
  const prev = document.getElementById('apNewImgPreview');
  prev.hidden = true;
  prev.removeAttribute('src');
}

/** Downloads the Inventory as JSON (Req 8.4). */
function apExport() {
  apGuard(() => {
    const blob = new Blob([Inventory.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = apEl('a', { href: url, download: `inventory-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

/** Imports the Inventory from a JSON file (Req 8.4, 8.5). */
function apImport(input) {
  const file = input.files && input.files[0];
  const msg = document.getElementById('apFileMsg');
  input.value = ''; // allow re-selecting the same file
  if (!file) return;
  apGuard(() => {
    file.text().then(text => {
      const res = Inventory.importJson(text);
      msg.classList.toggle('ap-ok', res.ok);
      msg.textContent = res.ok ? `Imported ${res.count} items` : res.error; // "Invalid inventory file"
    }, () => {
      msg.classList.remove('ap-ok');
      msg.textContent = 'Invalid inventory file';
    });
  });
}

/* ===== HISTORY DRAWER ===== */
function openHistDrawer() {
  withAdmin(showHistDrawer);
}

function showHistDrawer() {
  // History lives on its own page now
  if (!document.getElementById('histTableBody')) { location.href = 'history.html'; return; }
  const d = document.getElementById('histDrawer');
  if (d) {
    d.classList.add('open');
    document.getElementById('histBackdrop').classList.add('open');
  }
  loadHistory();
}

function closeHistDrawer() {
  const d = document.getElementById('histDrawer');
  if (!d) return;
  d.classList.remove('open');
  document.getElementById('histBackdrop').classList.remove('open');
}

function onHistFilterChange() {
  const mode = document.getElementById('histFilterMode').value;
  document.getElementById('histDateInput').style.display  = mode === 'day'   ? '' : 'none';
  document.getElementById('histMonthInput').style.display = mode === 'month' ? '' : 'none';
  loadHistory();
}

function loadHistory() {
  if (!window.BillHistory) return;
  const mode = document.getElementById('histFilterMode').value;
  let promise;

  if (mode === 'day') {
    const val = document.getElementById('histDateInput').value; // YYYY-MM-DD
    if (!val) { promise = window.BillHistory.getAllBillRecords(); }
    else {
      const [y,m,d] = val.split('-');
      const dStr = d + '-' + m + '-' + y;
      promise = window.BillHistory.getBillRecordsByDateRange(dStr, dStr);
    }
  } else if (mode === 'month') {
    const val = document.getElementById('histMonthInput').value; // YYYY-MM
    if (!val) { promise = window.BillHistory.getAllBillRecords(); }
    else {
      const [y,m] = val.split('-');
      promise = window.BillHistory.downloadBillHistory ? // reuse range logic
        (function(){
          const mm = parseInt(m,10), yyyy = parseInt(y,10);
          const first = '01-' + m + '-' + y;
          const last  = new Date(yyyy, mm, 0);
          const lastStr = String(last.getDate()).padStart(2,'0') + '-' + m + '-' + y;
          return window.BillHistory.getBillRecordsByDateRange(first, lastStr);
        })()
        : window.BillHistory.getAllBillRecords();
    }
  } else {
    promise = window.BillHistory.getAllBillRecords();
  }

  promise.then(renderHistoryTable).catch(function(e) {
    document.getElementById('histTableBody').innerHTML =
<<<<<<< HEAD
      '<tr><td colspan="9" class="hist-empty">Error: ' + e.message + '</td></tr>';
=======
      '<tr><td colspan="8" class="hist-empty">Error: ' + e.message + '</td></tr>';
>>>>>>> b48df7aceee0fbc479863f6df195622d6bc50bf2
  });
}

function renderHistoryTable(records) {
  const tbody = document.getElementById('histTableBody');
  const summary = document.getElementById('histSummary');

  if (!records || records.length === 0) {
<<<<<<< HEAD
    tbody.innerHTML = '<tr><td colspan="9" class="hist-empty">No records found.</td></tr>';
=======
    tbody.innerHTML = '<tr><td colspan="8" class="hist-empty">No records found.</td></tr>';
>>>>>>> b48df7aceee0fbc479863f6df195622d6bc50bf2
    summary.textContent = '';
    return;
  }

  const total = records.reduce(function(s, r) { return s + r.amount; }, 0);
  summary.textContent = records.length + ' bill' + (records.length > 1 ? 's' : '') +
    '  ·  Total: ₹' + total.toFixed(2);

  tbody.innerHTML = records.map(function(r, i) {
    const itemList = (r.items && r.items.length)
      ? r.items.map(function(it) {
          return it.emoji + ' ' + it.name + ' x' + it.qty + (it.spec && it.spec !== 'Standard' ? ' (' + it.spec + ')' : '');
        }).join('<br>')
      : '<span style="color:#737373">—</span>';
    
    // Print method indicator with icon
    const printMethod = r.printMethod || 'browser';
    let methodIcon = '';
    let methodText = '';
    let methodColor = '';
    
    if (printMethod === 'thermal') {
      methodIcon = '🖨️';
      methodText = 'Thermal';
      methodColor = '#d9a83e';
    } else if (printMethod === 'manual') {
      methodIcon = '✍️';
      methodText = 'Manual';
      methodColor = '#7dd3fc';
    } else {
      methodIcon = '🌐';
      methodText = 'Browser';
      methodColor = '#94a3b8';
    }
    
    const methodCell = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:.75rem;color:' + methodColor + '">' +
      '<span style="font-size:.9rem">' + methodIcon + '</span>' +
      '<span>' + methodText + '</span>' +
      '</span>';
    
    // Format type indicator - with backward compatibility
    const formatType = r.formatType || 'both'; // Default to 'both' for existing records
    let formatIcon = '';
    let formatText = '';
    let formatColor = '#64748b';
    
    if (formatType === 'customer') {
      formatIcon = '🧾';
      formatText = 'Customer';
    } else if (formatType === 'kitchen') {
      formatIcon = '👨‍🍳';
      formatText = 'Kitchen';
    } else if (formatType === 'none') {
      formatIcon = '📝';
      formatText = 'No Print';
    } else {
      formatIcon = '📋';
      formatText = 'Both';
    }
    
    const formatCell = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:.75rem;color:' + formatColor + '">' +
      '<span style="font-size:.9rem">' + formatIcon + '</span>' +
      '<span>' + formatText + '</span>' +
      '</span>';
    
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>#' + r.billNo + '</strong></td>' +
      '<td>' + r.date + '</td>' +
      '<td>' + r.time + '</td>' +
      '<td>' + methodCell + '</td>' +
      '<td>' + formatCell + '</td>' +
      '<td style="font-size:.78rem;line-height:1.6">' + itemList + '</td>' +
      '<td class="hist-amount">₹' + Number(r.amount).toFixed(2) + '</td>' +
<<<<<<< HEAD
      '<td><div class="hist-actions">' +
      '<button type="button" class="hist-print-btn" data-history-index="' + i + '" data-printer-id="printer1">Bill · P1</button>' +
      '<button type="button" class="hist-print-btn hist-print-kitchen-btn" data-history-index="' + i + '" data-printer-id="printer2">Kitchen · P2</button>' +
      '</div></td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.hist-print-btn').forEach(function(button) {
    button.addEventListener('click', function() {
      printHistoryBill(records[Number(button.dataset.historyIndex)], button, button.dataset.printerId);
    });
  });
}

async function printHistoryBill(record, button, printerId) {
  if (!record || !Array.isArray(record.items) || record.items.length === 0) {
    showErrorToast('Cannot print bill', 'This history record has no saved item details.');
    return;
  }

  const printer = getPrintersStatus()[printerId];
  const isCustomerReceipt = printerId === 'printer1';
  if (!printer.configured) {
    const label = isCustomerReceipt ? 'customer bill' : 'kitchen ticket';
    showErrorToast(`${printer.name} not configured`, `Configure ${printer.name} to print this saved ${label}.`,
      [{ label: 'Configure Printers', onClick: () => showPrinterConfig(), primary: true }]);
    return;
  }

  const dateParts = String(record.date || '').split('-').map(Number);
  const timeParts = String(record.time || '').split(':').map(Number);
  const billDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);
  const validDate = dateParts.length === 3 && timeParts.length === 2 &&
    dateParts.every(Number.isInteger) && timeParts.every(Number.isInteger) &&
    !Number.isNaN(billDate.getTime()) &&
    billDate.getDate() === dateParts[0] && billDate.getMonth() === dateParts[1] - 1 &&
    billDate.getFullYear() === dateParts[2] &&
    billDate.getHours() === timeParts[0] && billDate.getMinutes() === timeParts[1];
  if (!validDate) {
    showErrorToast('Cannot print bill', 'The saved bill date or time is invalid.');
    return;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Printing…';
  try {
    const billData = {
      billNo: record.billNo,
      customerName: record.customerName || '',
      items: record.items,
      subtotal: record.amount,
      grandTotal: record.amount,
      date: billDate
    };
    const receipt = isCustomerReceipt
      ? generateCustomerReceipt(billData)
      : generateKitchenTicket(billData);
    await printToUnifiedPrinter(printerId, receipt);
    showSuccessToast(isCustomerReceipt ? 'Bill printed' : 'Kitchen ticket printed',
      `Bill #${record.billNo} sent to ${printer.name}`);
  } catch (error) {
    showErrorToast(isCustomerReceipt ? 'Bill print failed' : 'Kitchen ticket print failed',
      error.message || 'Could not print the saved record.');
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
=======
      '</tr>';
  }).join('');
>>>>>>> b48df7aceee0fbc479863f6df195622d6bc50bf2
}

function downloadHistory() {
  if (!window.BillHistory) return;
  const mode = document.getElementById('histFilterMode').value;
  let promise, filename, label;

  if (mode === 'day') {
    const val = document.getElementById('histDateInput').value;
    if (!val) { alert('Pick a date first.'); return; }
    const [y,m,d] = val.split('-');
    const dStr = d + '-' + m + '-' + y;
    promise = window.BillHistory.getBillRecordsByDateRange(dStr, dStr);
    filename = 'bills-' + dStr + '.html';
    label = 'Date: ' + dStr;
  } else if (mode === 'month') {
    const val = document.getElementById('histMonthInput').value;
    if (!val) { alert('Pick a month first.'); return; }
    const [y,m] = val.split('-');
    const mm = parseInt(m,10), yyyy = parseInt(y,10);
    const first = '01-' + m + '-' + y;
    const last  = new Date(yyyy, mm, 0);
    const lastStr = String(last.getDate()).padStart(2,'0') + '-' + m + '-' + y;
    promise = window.BillHistory.getBillRecordsByDateRange(first, lastStr);
    filename = 'bills-' + m + '-' + y + '.html';
    label = 'Month: ' + m + '-' + y;
  } else {
    promise = window.BillHistory.getAllBillRecords();
    filename = 'bills-all.html';
    label = 'All Records';
  }

  promise.then(function(records) {
    const total = records.reduce(function(s,r){ return s + r.amount; }, 0);
    const rows = records.map(function(r, i) {
      const itemList = (r.items && r.items.length)
        ? r.items.map(function(it){ return it.emoji + ' ' + it.name + ' x' + it.qty + (it.spec && it.spec !== 'Standard' ? ' (' + it.spec + ')' : ''); }).join('<br>')
        : '—';
      
      // Print method for export
      const printMethod = r.printMethod || 'browser';
      const methodText = printMethod === 'thermal' ? '🖨️ Thermal' : printMethod === 'manual' ? '✍️ Manual' : '🌐 Browser';
      
      // Format type for export - with backward compatibility
      const formatType = r.formatType || 'both';
      let formatText = '';
      if (formatType === 'customer') {
        formatText = '🧾 Customer';
      } else if (formatType === 'kitchen') {
        formatText = '👨‍🍳 Kitchen';
      } else if (formatType === 'none') {
        formatText = '📝 No Print';
      } else {
        formatText = '📋 Both';
      }
      
      return '<tr>' +
        '<td>' + (i+1) + '</td>' +
        '<td><strong>#' + r.billNo + '</strong></td>' +
        '<td>' + r.date + '</td>' +
        '<td>' + r.time + '</td>' +
        '<td style="font-size:.8rem">' + methodText + '</td>' +
        '<td style="font-size:.8rem">' + formatText + '</td>' +
        '<td style="font-size:.8rem;line-height:1.7">' + itemList + '</td>' +
        '<td style="color:#b45309;font-weight:700;">&#x20B9;' + Number(r.amount).toFixed(2) + '</td>' +
        '</tr>';
    }).join('');

    const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>' +
      '<title>Bill History — Best Fruits Stall</title>' +
      '<style>' +
        'body{font-family:Eternalo,Georgia,"Segoe UI",serif;background:#121212;color:#f5f5f5;padding:24px;margin:0}' +
        'h2{font-size:1.3rem;margin-bottom:4px}' +
        '.meta{color:#a3a3a3;font-size:.85rem;margin-bottom:16px}' +
        'table{width:100%;border-collapse:collapse;font-size:.88rem}' +
        'th{background:#222;color:#a3a3a3;padding:10px 14px;text-align:left;border-bottom:1px solid #404040}' +
        'td{padding:10px 14px;border-bottom:1px solid #262626;vertical-align:top}' +
        'tr:nth-child(even) td{background:#1a1a1a}' +
        '.summary{margin-top:16px;font-size:.9rem;color:#a3a3a3}' +
        '.summary strong{color:#f5f5f5}' +
      '</style></head><body>' +
      '<h2>&#x1F4DC; Bill History — Best Fruits Stall</h2>' +
      '<div class="meta">' + label + ' &nbsp;|&nbsp; Generated: ' + new Date().toLocaleString('en-IN') + '</div>' +
      '<table><thead><tr><th>#</th><th>Bill No.</th><th>Date</th><th>Time</th><th>Method</th><th>Format</th><th>Items</th><th>Amount</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:#a3a3a3;padding:32px">No records found.</td></tr>') + '</tbody></table>' +
      '<div class="summary">' + records.length + ' bill' + (records.length !== 1 ? 's' : '') +
        ' &nbsp;·&nbsp; Total: <strong>&#x20B9;' + total.toFixed(2) + '</strong></div>' +
      '</body></html>';

    const blob = new Blob([html], {type: 'text/html'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }).catch(function(e){ alert('Download failed: ' + e.message); });
}


/**
 * Main print bill function - prints to unified thermal printers (USB or WiFi)
 */
async function printBill(mode) {
  if (billItems.length === 0) { 
    showWarningToast('Empty Bill', 'Add at least one item before printing');
    return; 
  }

  const status = getPrintersStatus();

  // Single-copy print: customer bill only (Printer 1) or kitchen ticket only (Printer 2)
  if (mode === 'customer' || mode === 'kitchen') {
    return printSingleFormat(mode, status);
  }
  
  // Check if at least one printer is configured
  if (!status.printer1.configured && !status.printer2.configured) {
    showErrorToast(
      'No Printers Configured',
      'Please configure at least one printer (USB or WiFi) before printing.',
      [
        {
          label: 'Configure Printers',
          onClick: () => showPrinterConfig(),
          primary: true
        }
      ]
    );
    return;
  }

  try {
    setPrintLoading(true, 'Generating receipt...');
    
    // Page left open past midnight: restart at 100 for the new day
    ensureTodayBillCounter();

    // Collect bill data from UI
    const billNo = document.getElementById('billNoInput').value;
    const customer = document.getElementById('customerName').value.trim();
    const now = new Date();
    
    // Calculate subtotal and grand total
    const grandTotalAmount = billItems.reduce((s, i) => s + i.total, 0);
    
    const itemsSnapshot = billItems.map(function(it) {
      var parts = [];
      if (it.ice) parts.push(it.ice);
      if (it.sugar && it.sugar !== 'Normal Sugar') parts.push(it.sugar);
      if (it.size  && it.size  !== 'Regular')      parts.push(it.size);
      if (it.note) parts.push(it.note);
      return { 
        name: it.name, 
        baseName: it.baseName || it.name,
        emoji: it.emoji, 
        qty: it.qty, 
        price: it.price, 
        total: it.total, 
        ice: it.ice,
        sugar: it.sugar,
        size: it.size,
        note: it.note,
        orderType: it.orderType || 'Dine In',
        spec: parts.join(', ') || 'Standard' 
      };
    });

    // Prepare bill data
    const billData = {
      billNo: billNo,
      customerName: customer,
      items: itemsSnapshot,
      subtotal: grandTotalAmount,
      grandTotal: grandTotalAmount,
      date: now
    };

    setPrintLoading(true, 'Printing to printers...');
    
    // Generate customer receipt for Printer 1
    const customerReceipt = generateCustomerReceipt(billData);
    
    // Generate kitchen ticket for Printer 2
    const kitchenTicket = generateKitchenTicket(billData);
    
    // Print to respective printers with different formats
    const results = await printDualFormats(customerReceipt, kitchenTicket);
    
    setPrintLoading(false);
    
    // Handle print results and display appropriate toast messages
    const p1Success = results.printer1.success;
    const p2Success = results.printer2.success;
    const p1Configured = status.printer1.configured;
    const p2Configured = status.printer2.configured;
    
    // Single-printer scenario handling
    if (p1Configured && !p2Configured && p1Success) {
      // Only Printer 1 configured - customer receipt only
      const p1Type = results.printer1.type === 'usb' ? '🔌 USB' : '📡 WiFi';
      showSuccessToast('Customer Receipt Printed', `Printed to ${p1Type} printer (Kitchen ticket not configured)`);
      saveBillToHistory(billNo, grandTotalAmount, itemsSnapshot, customer, 'customer');
    } else if (!p1Configured && p2Configured && p2Success) {
      // Only Printer 2 configured - kitchen ticket only
      const p2Type = results.printer2.type === 'usb' ? '🔌 USB' : '📡 WiFi';
      showSuccessToast('Kitchen Ticket Printed', `Printed to ${p2Type} printer (Customer receipt not configured)`);
      saveBillToHistory(billNo, grandTotalAmount, itemsSnapshot, customer, 'kitchen');
    } else if (p1Success && p2Success) {
      // Both printers succeeded
      const p1Type = results.printer1.type === 'usb' ? '🔌 USB' : '📡 WiFi';
      const p2Type = results.printer2.type === 'usb' ? '🔌 USB' : '📡 WiFi';
      showSuccessToast('Print Successful', `Customer receipt (${p1Type}) + Kitchen ticket (${p2Type})`);
      saveBillToHistory(billNo, grandTotalAmount, itemsSnapshot, customer, 'both');
    } else if (p1Success || p2Success) {
      // Partial success - at least one failed
      const successPrinter = p1Success ? status.printer1.name : status.printer2.name;
      const failedPrinter = p1Success ? status.printer2.name : status.printer1.name;
      const formatType = p1Success ? 'customer' : 'kitchen';
      showWarningToast(
        'Partial Success',
        `Printed to ${successPrinter}, but ${failedPrinter} failed`
      );
      saveBillToHistory(billNo, grandTotalAmount, itemsSnapshot, customer, formatType);
    } else {
      // Both failed - use handlePrintResults for error handling
      handlePrintResults(results, billData);
      return; // Don't save to history if print failed
    }
    
    // Auto-advance to next bill after printing
    clearCurrentBill();
    
  } catch (error) {
    console.error('Print error:', error);
    setPrintLoading(false);
    
    showErrorToast(
      'Print Failed',
      error.message || 'Failed to print receipt',
      [
        {
          label: 'Retry',
          onClick: () => printBill(),
          primary: true
        },
        {
          label: 'Configure Printers',
          onClick: () => showPrinterConfig(),
          primary: false
        }
      ]
    );
  }
}

/** Builds the bill snapshot used for printing and history. */
function collectBillData() {
  ensureTodayBillCounter(); // page left open past midnight: restart at 100
  const billNo = document.getElementById('billNoInput').value;
  const customer = document.getElementById('customerName').value.trim();
  const grandTotal = billItems.reduce((s, i) => s + i.total, 0);
  const items = billItems.map(function(it) {
    var parts = [];
    if (it.ice) parts.push(it.ice);
    if (it.sugar && it.sugar !== 'Normal Sugar') parts.push(it.sugar);
    if (it.size  && it.size  !== 'Regular')      parts.push(it.size);
    if (it.note) parts.push(it.note);
    return {
      name: it.name, baseName: it.baseName || it.name, emoji: it.emoji,
      qty: it.qty, price: it.price, total: it.total,
      ice: it.ice, sugar: it.sugar, size: it.size, note: it.note,
      orderType: it.orderType || 'Dine In',
      spec: parts.join(', ') || 'Standard'
    };
  });
  return { billNo, customerName: customer, items, subtotal: grandTotal, grandTotal, date: new Date() };
}

/**
 * Prints only one format: 'customer' -> Printer 1, 'kitchen' -> Printer 2.
 * The sale is saved to history with that format.
 */
async function printSingleFormat(mode, status) {
  const printerId = mode === 'customer' ? 'printer1' : 'printer2';
  const label = mode === 'customer' ? 'Customer bill' : 'Kitchen ticket';
  if (!status[printerId].configured) {
    showErrorToast(`${status[printerId].name} not configured`, `Configure it to print the ${label.toLowerCase()}.`,
      [{ label: 'Configure Printers', onClick: () => showPrinterConfig(), primary: true }]);
    return;
  }
  try {
    setPrintLoading(true, `Printing ${label.toLowerCase()}...`);
    const billData = collectBillData();
    const data = mode === 'customer' ? generateCustomerReceipt(billData) : generateKitchenTicket(billData);
    await printToUnifiedPrinter(printerId, data);
    setPrintLoading(false);
    showSuccessToast(`${label} printed`, `Sent to ${status[printerId].name}`);
    saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName, mode);
    clearCurrentBill();
  } catch (error) {
    setPrintLoading(false);
    showErrorToast(`${label} failed`, error.message || 'Print failed', [
      { label: 'Retry', onClick: () => printBill(mode), primary: true },
      { label: 'Save without printing', onClick: () => saveBillWithoutPrint(), primary: false }
    ]);
  }
}

/**
 * Records the sale in history without printing anything.
 * For customers who ate and paid without asking for a bill, or orders taken directly in the kitchen.
 */
function saveBillWithoutPrint() {
  if (billItems.length === 0) {
    showWarningToast('Empty Bill', 'Add the items the customer had before saving');
    return;
  }
  const billData = collectBillData();
  if (!confirm(`Save Bill #${billData.billNo} (₹${billData.grandTotal.toFixed(2)}) to history without printing?`)) return;
  if (!window.BillHistory) { showErrorToast('History unavailable', 'billHistory.js not loaded'); return; }
  // Save first so the history entry exists before the bill is cleared
<<<<<<< HEAD
  window.BillHistory.saveBillRecord(billData.billNo, billData.grandTotal, billData.items, 'manual', 'none', billData.customerName)
=======
  window.BillHistory.saveBillRecord(billData.billNo, billData.grandTotal, billData.items, 'manual', 'none')
>>>>>>> b48df7aceee0fbc479863f6df195622d6bc50bf2
    .then(function() {
      showSuccessToast('Saved to history', `Bill #${billData.billNo} recorded without printing`);
      finishBill(billData);
      clearCurrentBill();
    })
    .catch(function(err) {
      console.error('Manual bill save failed:', err);
      showErrorToast('Save failed', err.message || 'Could not save to history');
    });
}

/** QR order bookkeeping after a bill is recorded (shared with saveBillToHistory). */
function finishBill(billData) {
  if (activeQrOrderId) {
    var qrId = activeQrOrderId;
    var qrOrder = orderQueue.find(function(o) { return o.serverId === qrId; });
    if (window.firebaseConfig && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      firebase.database().ref('orderStatus/' + qrId).set({ billNo: billData.billNo, status: 'billed' })
        .then(function() { return firebase.database().ref('orders/' + qrId).remove(); })
        .catch(function(error) { console.error('Could not save or remove QR order in Firebase:', error); });
    }
    if (qrOrder) qrOrder.status = 'printed';
    activeQrOrderId = null;
    renderQueue();
  } else {
    addToQueue(billData.billNo, billData.customerName, billData.grandTotal, billData.items);
  }
}

/* ===== REMOVED: Browser Print and Old Serial Thermal Print (WiFi Only) ===== */

/**
 * Save bill to history (extracted common logic)
 * @param {string} billNo - Bill number
 * @param {number} amount - Total amount
 * @param {Array} items - Bill items snapshot
 * @param {string} customer - Customer name
 * @param {string} formatType - Format type ('customer', 'kitchen', 'both')
 */
function saveBillToHistory(billNo, amount, items, customer, formatType) {
  // Save the bill record (Req 5.5). Stock is a manual In/Out toggle, so nothing is deducted.
  function saveRecordAndDeduct() {
    if (!window.BillHistory) return;
<<<<<<< HEAD
    window.BillHistory.saveBillRecord(billNo, amount, items, 'wifi-thermal', formatType || 'both', customer)
=======
    window.BillHistory.saveBillRecord(billNo, amount, items, 'wifi-thermal', formatType || 'both')
>>>>>>> b48df7aceee0fbc479863f6df195622d6bc50bf2
      .catch(function(err) { console.error('Bill save failed:', err); });
  }

  saveRecordAndDeduct();
  // Marks a loaded QR order as billed, or adds manual bills to the local orders queue.
  finishBill({ billNo: billNo, customerName: customer, grandTotal: amount, items: items });
}

/**
 * Handle print results from dual printer printing
 * Displays appropriate error/warning toasts and provides retry options
 * @param {Object} results - Print results from printDualFormats
 * @param {Object} billData - Bill data for retry functionality
 */
function handlePrintResults(results, billData) {
  const status = getPrintersStatus();
  const p1Success = results.printer1.success;
  const p2Success = results.printer2.success;
  
  // Case 1: Both printers failed
  if (!p1Success && !p2Success) {
    const errors = [];
    if (results.printer1.error) errors.push(`${status.printer1.name}: ${results.printer1.error}`);
    if (results.printer2.error) errors.push(`${status.printer2.name}: ${results.printer2.error}`);
    
    showErrorToast(
      'Print Failed - Both Printers',
      errors.join('\n') || 'Both printers failed to print',
      [
        {
          label: 'Retry Both',
          onClick: () => retryPrint('both', billData),
          primary: true
        },
        {
          label: 'Check Printers',
          onClick: () => showPrinterConfig(),
          primary: false
        }
      ]
    );
  }
  // Case 2: Printer 1 (customer receipt) failed, Printer 2 succeeded
  else if (!p1Success && p2Success) {
    showToast({
      type: 'warning',
      title: 'Customer Receipt Failed',
      message: `${status.printer1.name} failed: ${results.printer1.error || 'Unknown error'}`,
      duration: 0,
      actions: [
        {
          label: 'Retry Printer 1',
          onClick: () => retryPrint('printer1', billData),
          primary: true
        },
        {
          label: 'Continue',
          onClick: () => {
            // Save to history and clear bill since kitchen ticket printed
            saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName, 'kitchen');
            clearCurrentBill();
          },
          primary: false
        }
      ]
    });
  }
  // Case 3: Printer 2 (kitchen ticket) failed, Printer 1 succeeded
  else if (p1Success && !p2Success) {
    showToast({
      type: 'warning',
      title: 'Kitchen Ticket Failed',
      message: `${status.printer2.name} failed: ${results.printer2.error || 'Unknown error'}`,
      duration: 0,
      actions: [
        {
          label: 'Retry Printer 2',
          onClick: () => retryPrint('printer2', billData),
          primary: true
        },
        {
          label: 'Continue',
          onClick: () => {
            // Save to history and clear bill since customer receipt printed
            saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName, 'customer');
            clearCurrentBill();
          },
          primary: false
        }
      ]
    });
  }
}

/**
 * Retry print for individual printers or both
 * @param {string} printerTarget - 'printer1', 'printer2', or 'both'
 * @param {Object} billData - Bill data to print
 */
async function retryPrint(printerTarget, billData) {
  try {
    setPrintLoading(true, 'Retrying print...');
    
    if (printerTarget === 'both') {
      // Retry both printers
      const customerReceipt = generateCustomerReceipt(billData);
      const kitchenTicket = generateKitchenTicket(billData);
      const results = await printDualFormats(customerReceipt, kitchenTicket);
      
      setPrintLoading(false);
      
      const p1Success = results.printer1.success;
      const p2Success = results.printer2.success;
      
      if (p1Success && p2Success) {
        showSuccessToast('Retry Successful', 'Both printers printed successfully');
        saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName);
        clearCurrentBill();
      } else {
        handlePrintResults(results, billData);
      }
    } else if (printerTarget === 'printer1') {
      // Retry only Printer 1 (customer receipt)
      const customerReceipt = generateCustomerReceipt(billData);
      const result = await printToUnifiedPrinter('printer1', customerReceipt);
      
      setPrintLoading(false);
      
      if (result.success) {
        showSuccessToast('Customer Receipt Printed', 'Printer 1 retry successful');
        saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName);
        clearCurrentBill();
      } else {
        showErrorToast(
          'Printer 1 Failed Again',
          result.error || 'Could not print customer receipt',
          [
            {
              label: 'Retry Again',
              onClick: () => retryPrint('printer1', billData),
              primary: true
            },
            {
              label: 'Continue Without',
              onClick: () => {
                saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName);
                clearCurrentBill();
              },
              primary: false
            }
          ]
        );
      }
    } else if (printerTarget === 'printer2') {
      // Retry only Printer 2 (kitchen ticket)
      const kitchenTicket = generateKitchenTicket(billData);
      const result = await printToUnifiedPrinter('printer2', kitchenTicket);
      
      setPrintLoading(false);
      
      if (result.success) {
        showSuccessToast('Kitchen Ticket Printed', 'Printer 2 retry successful');
        saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName);
        clearCurrentBill();
      } else {
        showErrorToast(
          'Printer 2 Failed Again',
          result.error || 'Could not print kitchen ticket',
          [
            {
              label: 'Retry Again',
              onClick: () => retryPrint('printer2', billData),
              primary: true
            },
            {
              label: 'Continue Without',
              onClick: () => {
                saveBillToHistory(billData.billNo, billData.grandTotal, billData.items, billData.customerName);
                clearCurrentBill();
              },
              primary: false
            }
          ]
        );
      }
    }
  } catch (error) {
    console.error('Retry print error:', error);
    setPrintLoading(false);
    
    showErrorToast(
      'Retry Failed',
      error.message || 'Failed to retry printing',
      [
        {
          label: 'Try Again',
          onClick: () => retryPrint(printerTarget, billData),
          primary: true
        },
        {
          label: 'Cancel',
          onClick: () => {},
          primary: false
        }
      ]
    );
  }
}

/**
 * Print different formats to designated printers
 * Routes customer receipt to Printer 1 and kitchen ticket to Printer 2
 * @param {Uint8Array} customerReceipt - ESC/POS data for customer receipt
 * @param {Uint8Array} kitchenTicket - ESC/POS data for kitchen ticket
 * @returns {Promise<Object>} Results with success status for each printer
 */
async function printDualFormats(customerReceipt, kitchenTicket) {
  const results = {
    printer1: { success: false, error: null },
    printer2: { success: false, error: null }
  };

  // Both printers can share one server; its printer-specific routes keep formats distinct.
  const promises = [];
  
  // Send customer receipt to Printer 1
  if (printerConnections.printer1.type) {
    promises.push(
      printToUnifiedPrinter('printer1', customerReceipt)
        .then(result => {
          results.printer1 = result;
        })
        .catch(error => {
          results.printer1 = { success: false, error: error.message };
        })
    );
  }
  
  // Send kitchen ticket to Printer 2
  if (printerConnections.printer2.type) {
    promises.push(
      printToUnifiedPrinter('printer2', kitchenTicket)
        .then(result => {
          results.printer2 = result;
        })
        .catch(error => {
          results.printer2 = { success: false, error: error.message };
        })
    );
  }

  // Execute both print jobs in parallel
  await Promise.all(promises);
  return results;
}

/**
 * Clear current bill and advance counter (extracted common logic)
 */
function clearCurrentBill() {
  billItems = [];
  advanceBillCounter();
  const custEl = document.getElementById('customerName');
  if (custEl) custEl.value = '';
  renderBill();
}

/* ===== ORDERS QUEUE ===== */
var orderQueue = [];
var ordersRef = window.firebaseConfig ? firebase.database().ref('orders') : null;
var firebaseConnectionRef = window.firebaseConfig ? firebase.database().ref('.info/connected') : null;

function escapeQueueText(value) {
  var div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function setQrConnection(message, connected) {
  var el = document.getElementById('oqConnection');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('connected', !!connected);
}

// Shows the shop sign-in when not signed in, otherwise reconnects.
function reconnectQr() {
  var user = window.firebase && firebase.auth && firebase.apps.length ? firebase.auth().currentUser : null;
  if (window.ShopAuth && (!user || user.isAnonymous)) { ShopAuth.showLogin(); return; }
  connectOrderServer();
}

function configureOrderServer() {
  connectOrderServer();
}

function connectOrderServer() {
  if (!ordersRef) {
    setQrConnection('Firebase config missing', false);
    return;
  }
  setQrConnection('Connecting…', false);
  ordersRef.off();
  firebaseConnectionRef.off();
  firebaseConnectionRef.on('value', function(snapshot) {
    setQrConnection(snapshot.val() === true ? 'QR live' : 'QR offline', snapshot.val() === true);
  }, handleOrderSyncError);
  // child_added replays every existing order first; only chime for orders that arrive after that.
  var qrInitialLoad = true;
  ordersRef.once('value').then(function() { qrInitialLoad = false; }, function() { qrInitialLoad = false; });
  ordersRef.on('child_added', function(snapshot) {
    var order = snapshot.val();
    var isNew = order && order.status === 'pending' && !orderQueue.some(function(o) { return o.serverId === snapshot.key; });
    if (order && order.status !== 'served') addQrOrder(order, snapshot.key);
    if (isNew && !qrInitialLoad) notifyNewQrOrder(order, snapshot.key);
    renderQueue();
  }, handleOrderSyncError);
  ordersRef.on('child_changed', function(snapshot) {
    updateQrOrder(snapshot.key, snapshot.val());
  }, handleOrderSyncError);
}

/* ===== NEW QR ORDER ALERT (toast + soft chime + system notification) ===== */
var orderChimeCtx = null;
var orderChimePending = false; // an order arrived before sound was unlocked
var orderChimeResume = null;
var orderTitleTimer = null;
var baseDocTitle = document.title;

function notifyNewQrOrder(order, serverId) {
  playOrderChime();
  var table = order && order.table != null ? order.table : '?';
  var items = (order && order.items) || [];
  var summary = items.slice(0, 3).map(function(it) {
    return escapeQueueText((it.name || 'Item') + ' x' + (Number(it.qty) || 1));
  }).join(', ') + (items.length > 3 ? ' +' + (items.length - 3) + ' more' : '');
  var total = Number(order && (order.total || order.amount || order.grandTotal)) || 0;
  var soundLocked = !orderChimeCtx || orderChimeCtx.state !== 'running';

  showToast({
    type: 'info',
    title: '🔔 New order · Table ' + escapeQueueText(table),
    message: summary + (total ? ' · ₹' + total.toFixed(2) : '') +
      (soundLocked ? '<br><small>Click anywhere on the page once to enable the alert sound.</small>' : ''),
    duration: 0, // stays until the cashier acts on it
    actions: [
      { label: 'Load & Print', primary: true, onClick: function() { loadQrOrder(serverId); } },
      { label: 'Later', onClick: function() {} }
    ]
  });

  flashTitle('🔔 New order · Table ' + table);

  // System notification is useful when the billing tab is in the background
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      var n = new Notification('New order · Table ' + table, { body: items.map(function(it) { return it.name + ' x' + (it.qty || 1); }).join(', '), tag: 'qr-order-' + serverId });
      n.onclick = function() { window.focus(); n.close(); };
    } catch (e) { /* notifications unsupported in this context */ }
  }
}

function flashTitle(text) {
  clearInterval(orderTitleTimer);
  var on = false;
  orderTitleTimer = setInterval(function() {
    document.title = (on = !on) ? text : baseDocTitle;
  }, 1000);
}
function stopFlashTitle() {
  clearInterval(orderTitleTimer);
  orderTitleTimer = null;
  document.title = baseDocTitle;
}
document.addEventListener('visibilitychange', function() { if (!document.hidden) setTimeout(stopFlashTitle, 3000); });

/* Notification chime (generated, no sound file). A louder, mid-range repeating
   pattern (square-wave, 660/880 Hz, 3 bursts) cuts through ambient noise on POS
   speakers. Browsers only allow audio after a user gesture, so the AudioContext
   is created in the unlock handler below. */
function playOrderChime() {
  try {
    var ctx = orderChimeCtx;
    if (!ctx) {
      orderChimePending = true;
      return;
    }
    if (ctx.state !== 'running') {
      orderChimePending = true;
      resumeOrderAudio().then(function(running) {
        if (running && orderChimePending) playOrderChime();
      });
      return;
    }
    orderChimePending = false;
    var t = ctx.currentTime + 0.005;
    // Master gain controls the overall level and prevents clipping when
    // multiple notes play.
    var masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
    // Mid-range alternating tones (660 Hz E5 / 880 Hz A5) in 3 bursts — a
    // telephone-ring cadence that reliably attracts attention. Notes never
    // overlap so the pattern stays clearly rhythmic.
    var noteDur = 0.28;            // each note's decay length (s)
    var slot = 0.32;               // spacing between consecutive notes (s)
    var burstGap = 0.16;           // extra gap between bursts (s)
    var peakGain = 0.75;           // per-note peak — loud but not harsh
    var notes = [];
    var baseOffset = 0;
    for (var burst = 0; burst < 3; burst++) {
      notes.push([660, baseOffset]);
      notes.push([880, baseOffset + slot]);
      baseOffset += slot * 2 + burstGap;
    }
    notes.forEach(function(n) { // 660 Hz then 880 Hz, x3 bursts
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = n[0];
      gain.gain.setValueAtTime(0.0001, t + n[1]);
      gain.gain.exponentialRampToValueAtTime(peakGain, t + n[1] + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + noteDur);
      osc.connect(gain).connect(masterGain);
      osc.start(t + n[1]);
      osc.stop(t + n[1] + noteDur + 0.02);
    });
  } catch (e) { console.warn('Order chime failed:', e); }
}

function resumeOrderAudio() {
  if (orderChimeCtx.state === 'running') return Promise.resolve(true);
  if (!orderChimeResume) {
    orderChimeResume = orderChimeCtx.resume().then(function() {
      return orderChimeCtx.state === 'running';
    }).catch(function(error) {
      console.warn('Order chime resume failed:', error);
      return false;
    }).then(function(running) {
      orderChimeResume = null;
      return running;
    });
  }
  return orderChimeResume;
}

// Browsers block audio until the page is clicked once; unlock on user interaction.
function unlockOrderAlerts() {
  stopFlashTitle();
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!orderChimeCtx) orderChimeCtx = new AC();
  resumeOrderAudio().then(function(running) {
    if (!running) return;
    ['click', 'keydown', 'touchstart'].forEach(function(ev) {
      document.removeEventListener(ev, unlockOrderAlerts, true);
    });
    if (orderChimePending) playOrderChime();
  }).catch(function() { /* try again on the next gesture */ });
  // Ask once for system notifications (needs a gesture in most browsers)
  if ('Notification' in window && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch (e) { /* ignore */ }
  }
}
['click', 'keydown', 'touchstart'].forEach(function(ev) {
  document.addEventListener(ev, unlockOrderAlerts, true);
});

function handleOrderSyncError(error) {
  console.error('QR order connection failed:', error);
  setQrConnection('QR connection failed', false);
}

function addQrOrder(order, orderId) {
  if (!order || !orderId || orderQueue.some(function(item) { return item.serverId === orderId; })) return;
  var orderItems = (order.items || []).map(function(item) {
    var quantity = Number(item.qty) || 1;
    var price = Number(item.price) || 0;
    return {
      name: item.name,
      baseName: item.baseName,
      emoji: item.emoji || '🍹',
      qty: quantity,
      price: price,
      total: Number(item.total) || price * quantity,
      ice: item.ice,
      sugar: item.sugar,
      size: item.size,
      note: item.note,
      orderType: item.orderType || order.orderType || 'Dine In',
      spec: item.spec || 'Standard'
    };
  });
  orderQueue.push({
    id: Date.now() + Math.random(),
    serverId: orderId,
    orderNo: order.orderNo || '',
    source: 'qr',
    table: order.table,
    status: order.status || 'pending',
    amount: Number(order.total || order.amount || order.grandTotal) || orderItems.reduce(function(sum, item) { return sum + item.total; }, 0),
    items: orderItems,
    time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    payMethod: null
  });
}

function updateQrOrder(orderId, order) {
  var row = orderQueue.find(function(item) { return item.serverId === orderId; });
  if (!row) {
    if (order && order.status !== 'served') addQrOrder(order, orderId);
    renderQueue();
    return;
  }
  if (!order || order.status === 'served') {
    orderQueue = orderQueue.filter(function(item) { return item.serverId !== orderId; });
  } else {
    row.status = order.status || row.status;
  }
  renderQueue();
}

function normalizeQrItemPreferences(item) {
  var source = item.spec || '';
  var nameMatch = String(item.name || '').match(/\(([^)]*)\)\s*$/);
  if (nameMatch && (!source || source === 'Standard')) source = nameMatch[1];
  var preferenceText = String(source);
  var normalized = Object.assign({}, item);

  if (normalized.ice == null) {
    if (/without ice/i.test(preferenceText)) normalized.ice = 'Without Ice';
    else if (/with ice/i.test(preferenceText)) normalized.ice = 'With Ice';
  }
  if (normalized.sugar == null) {
    if (/no sugar/i.test(preferenceText)) normalized.sugar = 'No Sugar';
    else if (/less sugar/i.test(preferenceText)) normalized.sugar = 'Less Sugar';
    else if (/normal sugar|\bnormal\b|with sugar/i.test(preferenceText)) normalized.sugar = 'Normal Sugar';
  }
  if (normalized.size == null && /large/i.test(preferenceText)) normalized.size = 'Large';
  if (!normalized.baseName && nameMatch) normalized.name = String(item.name).replace(/\s*\([^)]*\)\s*$/, '');
  return normalized;
}

function loadQrOrder(serverId) {
  // Bills are built on the billing page; the order waits there in the queue
  if (!document.getElementById('billItemsList')) { location.href = 'billing.html'; return; }
  var order = orderQueue.find(function(item) { return item.serverId === serverId; });
  if (!order) return;
  billItems = order.items.map(function(item) {
    return Object.assign(normalizeQrItemPreferences(item), { uid: Date.now() + Math.random() });
  });
  activeQrOrderId = serverId;
  document.getElementById('billNoInput').value = document.getElementById('billNoInput').value || String(BILL_START_NUMBER);
  document.getElementById('customerName').value = 'Table ' + order.table;
  renderBill();
  printBill();
}

function setQrOrderStatus(serverId, status) {
  if (!ordersRef || !serverId) return;
  firebase.database().ref('orders/' + serverId + '/status').set(status)
    .catch(function(error) { console.error('Could not update QR order status:', error); });
}

function addToQueue(billNo, customer, amount, items) {
  var now = new Date();
  orderQueue.push({
    id: Date.now(),
    billNo: billNo,
    customer: customer || '',
    amount: amount,
    items: items || [],
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    payMethod: null
  });
  renderQueue();
}

function renderQueue() {
  var list = document.getElementById('oqList');
  var badge = document.getElementById('oqCount');
  if (!list || !badge) return; // queue is shown on the billing page
  badge.textContent = orderQueue.length;

  if (orderQueue.length === 0) {
    list.innerHTML = '<div class="oq-empty"><span class="icon">✅</span>No pending orders.</div>';
    return;
  }

  list.innerHTML = orderQueue.map(function(o) {
    // Build compact items summary: "🥭 Mango Juice x2, 🍉 Watermelon Juice x1"
    var itemsSummary = o.items.map(function(it) {
      return it.emoji + ' ' + it.name + ' x' + it.qty;
    }).join(', ');

    var cashSel = o.payMethod === 'cash' ? ' selected-cash' : '';
    var gpaySel = o.payMethod === 'gpay' ? ' selected-gpay' : '';
    var doneReady = o.payMethod ? ' ready' : '';
    var gpayVerify = o.payMethod === 'gpay'
      ? '<div class="oq-row-gpay show">GPay: Ask customer to send <strong>₹' + Number(o.amount).toFixed(2) + '</strong> · ' + (o.source === 'qr' ? 'Table <strong>' + escapeQueueText(o.table) + '</strong>' : 'Bill <strong>#' + escapeQueueText(o.billNo) + '</strong>') + '</div>'
      : '<div class="oq-row-gpay"></div>';

    var qrTable = o.source === 'qr'
      ? '<span class="oq-row-bill">Table ' + escapeQueueText(o.table) + '</span>'
      : '<span class="oq-row-bill">Bill #' + escapeQueueText(o.billNo) + '</span>';
    var qrNeedsPrint = o.source === 'qr' && o.status !== 'preparing' && o.status !== 'printed';
    var qrAction = qrNeedsPrint
      ? '<button class="oq-row-pay-btn" onclick="loadQrOrder(\'' + escapeQueueText(o.serverId) + '\')">Load &amp; Print</button>'
      : '';
    var paymentActions = '<button class="oq-row-pay-btn' + cashSel + '" onclick="setPayMethod(' + o.id + ',\'cash\')">💵 Cash</button>' +
      '<button class="oq-row-pay-btn' + gpaySel + '" onclick="setPayMethod(' + o.id + ',\'gpay\')">📱 GPay</button>' +
      '<button class="oq-row-done' + doneReady + '" onclick="completeOrder(' + o.id + ')" title="Mark as done">✓</button>';

    return '<div class="oq-row" id="oqcard-' + o.id + '">' +
      '<div class="oq-row-info">' +
        '<div class="oq-row-main">' +
          qrTable +
          (o.source === 'qr' ? '<span class="oq-row-time">QR order' + (o.orderNo ? ' · ' + escapeQueueText(o.orderNo) : '') + '</span>' : '') +
          '<span class="oq-row-time">' + o.time + '</span>' +
        '</div>' +
        '<span class="oq-row-items">' + itemsSummary + '</span>' +
      '</div>' +
      '<span class="oq-row-amount">₹' + Number(o.amount).toFixed(2) + '</span>' +
      '<div class="oq-row-pay">' +
        qrAction +
        (o.source !== 'qr' || !qrNeedsPrint ? paymentActions : '') +
      '</div>' +
      gpayVerify +
    '</div>';
  }).join('');
}

function setPayMethod(id, method) {
  var order = orderQueue.find(function(o) { return o.id === id; });
  if (!order) return;
  order.payMethod = order.payMethod === method ? null : method;
  renderQueue();
}

function completeOrder(id) {
  var row = document.getElementById('oqcard-' + id);
  if (row) {
    row.classList.add('removing');
    setTimeout(function() {
      var completed = orderQueue.find(function(o) { return o.id === id; });
      orderQueue = orderQueue.filter(function(o) { return o.id !== id; });
      if (completed && completed.serverId) setQrOrderStatus(completed.serverId, 'served');
      renderQueue();
    }, 300);
  }
}

/* ===== REPORTS ===== */
var rptMode = 'day';
var RPT_COLORS = [
  '#D9AA45', // metallic gold
  '#F5D27A', // champagne highlight
  '#B87828', // antique gold
  '#E5E0D2', // champagne neutral
  '#FFFFFF', // white for contrast
  '#D9AA45', '#F5D27A', '#B87828', '#8F641D', '#DFAF7A',
  '#C76B5E', '#C8B98F', '#F7E9D8', '#A88A50', '#6F5425'
];

function setRptMode(mode) {
  rptMode = mode;
  document.getElementById('rptBtnDay').classList.toggle('active', mode === 'day');
  document.getElementById('rptBtnMonth').classList.toggle('active', mode === 'month');
  var allBtn = document.getElementById('rptBtnAll');
  if (allBtn) allBtn.classList.toggle('active', mode === 'all');
  document.getElementById('rptDatePicker').style.display  = mode === 'day'   ? '' : 'none';
  document.getElementById('rptMonthPicker').style.display = mode === 'month' ? '' : 'none';
  loadReports();
}

function loadReports() {
  if (!window.BillHistory) return;
  var promise;
  if (rptMode === 'all') {
    promise = window.BillHistory.getAllBillRecords();
  } else if (rptMode === 'day') {
    var val = document.getElementById('rptDatePicker').value;
    if (!val) { renderReports([]); return; }
    var parts = val.split('-');
    var dStr = parts[2] + '-' + parts[1] + '-' + parts[0];
    promise = window.BillHistory.getBillRecordsByDateRange(dStr, dStr);
  } else {
    var mval = document.getElementById('rptMonthPicker').value;
    if (!mval) { renderReports([]); return; }
    var mp = mval.split('-');
    var mm = parseInt(mp[1], 10), yyyy = parseInt(mp[0], 10);
    var first = '01-' + mp[1] + '-' + mp[0];
    var lastD = new Date(yyyy, mm, 0);
    var lastStr = String(lastD.getDate()).padStart(2,'0') + '-' + mp[1] + '-' + mp[0];
    promise = window.BillHistory.getBillRecordsByDateRange(first, lastStr);
  }
  promise.then(renderReports).catch(function(e) { console.error('Reports error:', e); });
}

/* Day-by-day totals for the selected period (newest first). Clicking a row opens that day. */
function renderReportDays(records) {
  var body = document.getElementById('rptDaysBody');
  if (!body) return;
  var days = {};
  records.forEach(function(r) {
    var d = days[r.date] || (days[r.date] = { date: r.date, bills: 0, items: 0, revenue: 0 });
    d.bills += 1;
    d.revenue += Number(r.amount) || 0;
    (r.items || []).forEach(function(it) { d.items += (it.qty || 1); });
  });
  var list = Object.values(days).sort(function(a, b) {
    return window.BillHistory._dateKey(b.date) - window.BillHistory._dateKey(a.date);
  });
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="5" class="hist-empty">No bills saved on this device for this period.</td></tr>';
    return;
  }
  body.innerHTML = list.map(function(d) {
    var p = d.date.split('-'); // DD-MM-YYYY
    return '<tr><td>' + d.date + '</td><td>' + d.bills + '</td><td>' + d.items + '</td>' +
      '<td class="hist-amount">₹' + d.revenue.toFixed(2) + '</td>' +
      '<td><button type="button" class="ap-small-btn" onclick="openReportDay(\'' + p[2] + '-' + p[1] + '-' + p[0] + '\')">View day</button></td></tr>';
  }).join('');
}

function openReportDay(isoDate) {
  document.getElementById('rptDatePicker').value = isoDate;
  setRptMode('day');
}

function renderReports(records) {
  renderReportDays(records);
  // Aggregate item quantities and revenue
  var itemMap = {};
  records.forEach(function(r) {
    if (!r.items) return;
    r.items.forEach(function(it) {
      var key = it.name;
      if (!itemMap[key]) itemMap[key] = { name: it.name, emoji: it.emoji || '', qty: 0, revenue: 0 };
      itemMap[key].qty     += (it.qty || 1);
      itemMap[key].revenue += (it.total || 0);
    });
  });

  var items = Object.values(itemMap).sort(function(a,b) { return b.qty - a.qty; });
  var totalQty     = items.reduce(function(s,i){ return s + i.qty; }, 0);
  var totalRevenue = items.reduce(function(s,i){ return s + i.revenue; }, 0);
  var totalBills   = records.length;

  // Stats row
  var statsEl = document.getElementById('rptStats');
  if (items.length === 0) {
    statsEl.innerHTML = '';
    document.getElementById('rptPieLegend').innerHTML = '';
    clearCanvas('rptPieCanvas');
    clearCanvas('rptBarCanvas');
    drawEmpty('rptPieCanvas', 'No data for selected period');
    drawEmpty('rptBarCanvas', 'No data for selected period');
    return;
  }
  statsEl.innerHTML =
    stat('₹' + totalRevenue.toFixed(0), 'Total Revenue') +
    stat(totalBills, 'Bills') +
    stat(totalQty, 'Items Sold') +
    stat(items.length, 'Unique Items') +
    stat('₹' + (totalBills ? (totalRevenue / totalBills).toFixed(0) : 0), 'Avg Bill');

  drawPie(items, totalQty);
  drawBar(items);
}

function stat(val, lbl) {
  return '<div class="rpt-stat"><div class="rpt-stat-val">' + val + '</div><div class="rpt-stat-lbl">' + lbl + '</div></div>';
}

function clearCanvas(id) {
  var canvas = document.getElementById(id);
  var ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 400;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawEmpty(id, msg) {
  var canvas = document.getElementById(id);
  canvas.width = canvas.offsetWidth || 400;
  canvas.height = 200;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c4a882';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
}

function drawPie(items, totalQty) {
  var canvas = document.getElementById('rptPieCanvas');
  canvas.width  = canvas.offsetWidth || 400;
  canvas.height = 300;
  var ctx   = canvas.getContext('2d');
  var cx    = canvas.width / 2;
  var cy    = canvas.height / 2;
  var r     = Math.min(cx, cy) - 20;
  var angle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  items.forEach(function(item, i) {
    var slice = (item.qty / totalQty) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = RPT_COLORS[i % RPT_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#2e1010';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label if slice big enough
    if (slice > 0.25) {
      var mid = angle + slice / 2;
      var lx  = cx + (r * 0.65) * Math.cos(mid);
      var ly  = cy + (r * 0.65) * Math.sin(mid);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round((item.qty / totalQty) * 100) + '%', lx, ly);
    }
    angle += slice;
  });

  // Legend
  var legendEl = document.getElementById('rptPieLegend');
  legendEl.innerHTML = items.map(function(item, i) {
    return '<div class="rpt-legend-item">' +
      '<div class="rpt-legend-dot" style="background:' + RPT_COLORS[i % RPT_COLORS.length] + '"></div>' +
      item.emoji + ' ' + item.name + ' (' + item.qty + ')' +
      '</div>';
  }).join('');
}

function drawBar(items) {
  var canvas = document.getElementById('rptBarCanvas');
  canvas.width  = canvas.offsetWidth || 400;
  canvas.height = 300;
  var ctx    = canvas.getContext('2d');
  var pad    = { top: 20, right: 20, bottom: 80, left: 50 };
  var W      = canvas.width  - pad.left - pad.right;
  var H      = canvas.height - pad.top  - pad.bottom;
  var maxQty = Math.max.apply(null, items.map(function(i){ return i.qty; }));
  var barW   = Math.max(8, Math.floor(W / items.length) - 6);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gridlines
  ctx.strokeStyle = '#5c2a2a';
  ctx.lineWidth = 1;
  for (var g = 0; g <= 4; g++) {
    var gy = pad.top + H - (g / 4) * H;
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + W, gy); ctx.stroke();
    ctx.fillStyle = '#c4a882';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round((g / 4) * maxQty), pad.left - 6, gy);
  }

  // Bars
  items.forEach(function(item, i) {
    var bh  = maxQty > 0 ? (item.qty / maxQty) * H : 0;
    var bx  = pad.left + i * (W / items.length) + (W / items.length - barW) / 2;
    var by  = pad.top + H - bh;
    var col = RPT_COLORS[i % RPT_COLORS.length];

    // Bar fill
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, barW, bh, [4,4,0,0]) : ctx.rect(bx, by, barW, bh);
    ctx.fill();

    // Value on top
    if (bh > 14) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(item.qty, bx + barW / 2, by - 2);
    }

    // X-axis label (emoji + truncated name)
    ctx.fillStyle = '#c4a882';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var label = item.emoji + ' ' + (item.name.length > 8 ? item.name.slice(0,7) + '…' : item.name);
    ctx.save();
    ctx.translate(bx + barW / 2, pad.top + H + 8);
    ctx.rotate(-Math.PI / 5);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Y-axis line
  ctx.strokeStyle = '#5c2a2a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + H);
  ctx.lineTo(pad.left + W, pad.top + H);
  ctx.stroke();
}

/* ===== REPORTS DRAWER ===== */
function openRptDrawer() {
  withAdmin(showRptDrawer);
}

function showRptDrawer() {
  // Reports live on their own page now
  if (!document.getElementById('rptStats')) { location.href = 'reports.html'; return; }
  var d = document.getElementById('rptDrawer');
  var b = document.getElementById('rptBackdrop');
  if (!d) { loadReports(); return; }
  // make elements visible first
  d.style.display = 'flex';
  b.style.display = 'block';
  // force reflow then open
  void d.offsetWidth;
  d.classList.add('open');
  b.classList.add('open');
  setTimeout(loadReports, 80);
}

function closeRptDrawer() {
  var d = document.getElementById('rptDrawer');
  var b = document.getElementById('rptBackdrop');
  if (!d) return;
  d.classList.remove('open');
  b.classList.remove('open');
  // hide after transition completes
  setTimeout(function() { d.style.display = 'none'; b.style.display = 'none'; }, 320);
}

// Init reports default dates
(function initReports() {
  var today = new Date();
  var yy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var dd = String(today.getDate()).padStart(2, '0');
  if (!document.getElementById('rptDatePicker')) return; // not on the reports page
  document.getElementById('rptDatePicker').value  = yy + '-' + mm + '-' + dd;
  document.getElementById('rptMonthPicker').value = yy + '-' + mm;
})();

/* ===== PAGE BOOT: each page opens its own view (billing.html, history.html, ...) ===== */
/** Shows this page's admin view (used on load and after logging in from the sidebar). */
function showPageAdminView() {
  var page = document.body.dataset.page;
  if (!['history', 'reports', 'inventory'].includes(page)) return;
  setAdminControls(true); // unhide first so charts measure their real width
  if (page === 'history') showHistDrawer();
  else if (page === 'reports') setRptMode('all'); // open on every saved day; pick Day/Month to narrow
  else showAdminPanelDrawer();
}

/** Sidebar / notice "Admin Login": stay on this page and open its view. */
function pageAdminLogin() {
  showAdminLogin(['history', 'reports', 'inventory'].includes(document.body.dataset.page) ? showPageAdminView : function () {});
}

(function bootPage() {
  var page = document.body.dataset.page;
  function run() {
    if (page === 'live-map') { openLiveMapPage(); return; }
    // Admin pages: open the view when a valid session exists; otherwise the "admin only" notice stays
    if (['history', 'reports', 'inventory'].includes(page) && window.AdminAuth) {
      AdminAuth.validate().then(function (ok) { if (ok) showPageAdminView(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else setTimeout(run, 0);
})();

/* Live Map page: boot.js is a module (deferred), so wait for window.BFSLiveMap */
function openLiveMapPage() {
  var tries = 0;
  (function wait() {
    if (window.BFSLiveMap) {
      window.BFSLiveMap.open(); // asks for the shop sign-in first when needed
      // Open as soon as the shop sign-in completes (open() is a no-op if already open)
      if (window.ShopAuth && window.firebaseConfig) ShopAuth.whenShop(function () { window.BFSLiveMap.open(); });
      return;
    }
    if (++tries < 100) setTimeout(wait, 50);
  })();
}
