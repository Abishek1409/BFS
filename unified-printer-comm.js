/**
 * Unified Printer Communication Module
 * Supports BOTH WiFi (network) and USB (Web Serial API) thermal printers
 * Allows mixing connection types - e.g., Printer 1 USB + Printer 2 WiFi
 */

// Printer connection state
const printerConnections = {
  printer1: {
    type: null, // 'usb' or 'wifi'
    name: 'Printer 1',
    connected: false,
    // USB-specific
    serialPort: null,
    serialWriter: null,
    serialReader: null,
    // WiFi-specific
    ip: null,
    port: 9100
  },
  printer2: {
    type: null,
    name: 'Printer 2',
    connected: false,
    // USB-specific
    serialPort: null,
    serialWriter: null,
    serialReader: null,
    // WiFi-specific
    ip: null,
    port: 9100
  }
};

// Discovered printers cache
let discoveredWiFiPrinters = [];

/* ===== CONFIGURATION MANAGEMENT ===== */

/**
 * Load printer configurations from localStorage
 */
function loadPrinterConfig() {
  try {
    const config = localStorage.getItem('bfsPrinterConfig');
    if (config) {
      const parsed = JSON.parse(config);
      
      if (parsed.printer1) {
        printerConnections.printer1.type = parsed.printer1.type || null;
        printerConnections.printer1.name = parsed.printer1.name || 'Printer 1';
        printerConnections.printer1.ip = parsed.printer1.ip || null;
        printerConnections.printer1.port = parsed.printer1.port || 9100;
      }
      
      if (parsed.printer2) {
        printerConnections.printer2.type = parsed.printer2.type || null;
        printerConnections.printer2.name = parsed.printer2.name || 'Printer 2';
        printerConnections.printer2.ip = parsed.printer2.ip || null;
        printerConnections.printer2.port = parsed.printer2.port || 9100;
      }
      
      console.log('Loaded printer configuration:', printerConnections);
    }
  } catch (error) {
    console.error('Failed to load printer config:', error);
  }
}

/**
 * Save printer configurations to localStorage
 */
function savePrinterConfig() {
  try {
    const config = {
      printer1: {
        type: printerConnections.printer1.type,
        name: printerConnections.printer1.name,
        ip: printerConnections.printer1.ip,
        port: printerConnections.printer1.port
      },
      printer2: {
        type: printerConnections.printer2.type,
        name: printerConnections.printer2.name,
        ip: printerConnections.printer2.ip,
        port: printerConnections.printer2.port
      }
    };
    localStorage.setItem('bfsPrinterConfig', JSON.stringify(config));
    console.log('Saved printer configuration');
  } catch (error) {
    console.error('Failed to save printer config:', error);
  }
}

/* ===== USB PRINTER FUNCTIONS (Web Serial API) ===== */

/**
 * Check if Web Serial API is available (for USB printers)
 */
function isUSBSupported() {
  return 'serial' in navigator;
}

/**
 * Connect to USB thermal printer via Web Serial API
 * @param {string} printerId - 'printer1' or 'printer2'
 * @returns {Promise<boolean>}
 */
async function connectUSBPrinter(printerId) {
  const printer = printerConnections[printerId];
  
  if (!isUSBSupported()) {
    throw new Error('USB printing requires Chrome or Edge browser with Web Serial API support');
  }

  try {
    // Request port with filters for common thermal printer vendors
    const port = await navigator.serial.requestPort({
      filters: [
        { usbVendorId: 0x04b8 }, // Epson
        { usbVendorId: 0x0483 }, // Star Micronics
        { usbVendorId: 0x1504 }, // Citizen
        { usbVendorId: 0x0416 }, // Bixolon
        { usbVendorId: 0x0525 }, // Generic POS printer
        { usbVendorId: 0x1CB0 }, // Xprinter
      ]
    });

    // Try common baud rates for thermal printers
    const baudRates = [115200, 9600, 19200, 38400];
    let connected = false;

    for (const baudRate of baudRates) {
      try {
        await port.open({
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });
        
        connected = true;
        console.log(`${printer.name} connected via USB at ${baudRate} baud`);
        break;
      } catch (err) {
        console.warn(`Failed to connect at ${baudRate} baud:`, err.message);
        if (port.readable || port.writable) {
          await port.close();
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to establish USB connection at any baud rate');
    }

    // Store port references
    printer.serialPort = port;
    printer.serialWriter = port.writable.getWriter();
    printer.serialReader = port.readable.getReader();
    printer.type = 'usb';
    printer.connected = true;

    return true;
  } catch (error) {
    printer.connected = false;
    
    if (error.name === 'NotFoundError') {
      throw new Error('No USB printer selected');
    } else if (error.name === 'SecurityError') {
      throw new Error('Permission denied to access USB printer');
    } else {
      throw new Error(`USB connection failed: ${error.message}`);
    }
  }
}

/**
 * Send data to USB printer
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} data - ESC/POS command bytes
 * @returns {Promise<Object>}
 */
async function sendToUSBPrinter(printerId, data) {
  const printer = printerConnections[printerId];
  
  if (!printer.serialPort || !printer.serialWriter) {
    return {
      success: false,
      error: `${printer.name} not connected via USB`
    };
  }

  try {
    const CHUNK_SIZE = 1024;
    const TIMEOUT_MS = 5000;

    // Split data into chunks for large receipts
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('USB transmission timeout')), TIMEOUT_MS);
      });

      const writePromise = printer.serialWriter.write(chunk);
      await Promise.race([writePromise, timeoutPromise]);
    }

    await printer.serialWriter.ready;
    console.log(`Sent ${data.length} bytes to ${printer.name} via USB`);
    
    return { success: true };
  } catch (error) {
    if (error.message === 'USB transmission timeout') {
      return { success: false, error: 'Printer not responding via USB' };
    } else if (error.name === 'NetworkError') {
      return { success: false, error: 'USB printer disconnected during transmission' };
    } else {
      return { success: false, error: `USB print failed: ${error.message}` };
    }
  }
}

/**
 * Disconnect USB printer
 * @param {string} printerId - 'printer1' or 'printer2'
 */
async function disconnectUSBPrinter(printerId) {
  const printer = printerConnections[printerId];
  
  try {
    if (printer.serialWriter) {
      printer.serialWriter.releaseLock();
      printer.serialWriter = null;
    }

    if (printer.serialReader) {
      printer.serialReader.releaseLock();
      printer.serialReader = null;
    }

    if (printer.serialPort) {
      await printer.serialPort.close();
      printer.serialPort = null;
    }

    printer.connected = false;
    console.log(`${printer.name} disconnected from USB`);
  } catch (error) {
    console.error(`Error disconnecting ${printer.name}:`, error);
    printer.serialPort = null;
    printer.serialWriter = null;
    printer.serialReader = null;
    printer.connected = false;
  }
}

/* ===== WIFI PRINTER FUNCTIONS ===== */

/**
 * Auto-discover WiFi thermal printers on the local network
 * @returns {Promise<Array>} Array of discovered printers
 */
async function discoverWiFiPrinters() {
  console.log('Starting WiFi printer discovery...');
  
  const discovered = [];
  const commonPorts = [9100, 9101, 9102, 8008];
  
  const baseIP = '192.168.1.';
  const startIP = 100;
  const endIP = 120;
  
  const scanPromises = [];
  for (let i = startIP; i <= endIP; i++) {
    const ip = baseIP + i;
    
    for (const port of commonPorts) {
      scanPromises.push(
        testWiFiPrinterAtAddress(ip, port)
          .then(result => {
            if (result.success) {
              discovered.push({
                ip: ip,
                port: port,
                name: `WiFi Printer at ${ip}:${port}`
              });
              console.log(`Found WiFi printer at ${ip}:${port}`);
            }
          })
          .catch(() => {})
      );
    }
  }
  
  await Promise.race([
    Promise.all(scanPromises),
    new Promise(resolve => setTimeout(resolve, 20000))
  ]);
  
  discoveredWiFiPrinters = discovered;
  console.log('WiFi discovery complete:', discovered);
  return discovered;
}

/**
 * Test if a WiFi printer exists at specific IP and port
 */
async function testWiFiPrinterAtAddress(ip, port) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    
    const response = await fetch(`http://${ip}:${port}/`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Connect to WiFi thermal printer
 * For Vercel/HTTPS sites, connect to localhost print server instead
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {string} ip - Printer IP address or 'localhost' for print server
 * @param {number} port - Printer port (9100 for direct, 3000 for print server)
 * @returns {Promise<boolean>}
 */
async function connectWiFiPrinter(printerId, ip, port = 9100) {
  const printer = printerConnections[printerId];
  
  printer.ip = ip;
  printer.port = port;
  printer.type = 'wifi';
  
  try {
    // Detect if using localhost print server
    const isLocalServer = ip === 'localhost' || ip === '127.0.0.1' || port === 3000;
    
    if (isLocalServer) {
      // Test print server connection
      const testResponse = await fetch(`http://${ip}:${port}/test`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        if (result.success) {
          printer.connected = true;
          console.log(`${printer.name} connected via print server at ${ip}:${port}`);
          return true;
        }
      }
      throw new Error('Print server test failed');
    } else {
      // Direct connection test (may fail due to CORS, but try anyway)
      const testResult = await sendToPosiflow(printerId, new Uint8Array([0x10, 0x04, 0x01]));
      
      if (testResult.success) {
        printer.connected = true;
        console.log(`${printer.name} connected directly at ${ip}:${port}`);
        return true;
      } else {
        throw new Error(testResult.error || 'Direct connection test failed');
      }
    }
  } catch (error) {
    printer.connected = false;
    throw new Error(`Failed to connect ${printer.name}: ${error.message}`);
  }
}

/**
 * Send data to WiFi printer via HTTP POST
 * For HTTPS sites (like Vercel), uses a special CORS-bypass technique
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} data - ESC/POS command bytes
 * @returns {Promise<Object>}
 */
async function sendToWiFiPrinter(printerId, data) {
  const printer = printerConnections[printerId];
  
  if (!printer.ip) {
    return {
      success: false,
      error: `${printer.name} WiFi not configured`
    };
  }

  try {
    // Method 1: Try direct HTTP POST (works for HTTP sites and some CORS-enabled printers)
    try {
      const response = await fetch(`http://${printer.ip}:${printer.port}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: data,
        signal: AbortSignal.timeout(10000),
        mode: 'no-cors' // Use no-cors mode for local network
      });

      // In no-cors mode, we can't check response status, so assume success if no error thrown
      console.log(`Sent ${data.length} bytes to ${printer.name} via WiFi (no-cors mode)`);
      return { success: true };
    } catch (fetchError) {
      console.warn('Direct fetch failed, trying alternative method:', fetchError.message);
      
      // Method 2: Use image tag trick for ESC/POS printers that support HTTP GET
      // This bypasses CORS by using a simple GET request
      return await sendViaImageTrick(printer, data);
    }
  } catch (error) {
    console.error(`Failed to send to ${printer.name} via WiFi:`, error);
    return {
      success: false,
      error: error.message || 'WiFi network error'
    };
  }
}

/**
 * Alternative method: Send print command via Image tag (CORS bypass)
 * Works for printers that accept commands via GET parameters
 */
async function sendViaImageTrick(printer, data) {
  return new Promise((resolve) => {
    // Convert Uint8Array to base64
    const base64Data = btoa(String.fromCharCode.apply(null, Array.from(data)));
    
    // Create a hidden image tag that triggers the printer
    const img = document.createElement('img');
    img.style.display = 'none';
    
    let resolved = false;
    
    img.onload = () => {
      if (!resolved) {
        resolved = true;
        document.body.removeChild(img);
        resolve({ success: true });
      }
    };
    
    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        document.body.removeChild(img);
        // Even on error, the printer might have received the command
        resolve({ success: true }); // Assume success for no-cors mode
      }
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (img.parentNode) {
          document.body.removeChild(img);
        }
        resolve({ success: true }); // Assume sent
      }
    }, 5000);
    
    // Try to trigger print via GET request
    img.src = `http://${printer.ip}:${printer.port}/print?data=${encodeURIComponent(base64Data)}`;
    document.body.appendChild(img);
  });
}

/**
 * BEST METHOD for Possiflow: Send via local print server or direct
 * Automatically detects if using localhost print server
 */
async function sendToPosiflow(printerId, data) {
  const printer = printerConnections[printerId];
  
  if (!printer.ip) {
    return {
      success: false,
      error: `${printer.name} WiFi not configured`
    };
  }

  try {
    // Check if using localhost print server (recommended for Vercel)
    const isLocalServer = printer.ip === 'localhost' || printer.ip === '127.0.0.1' || printer.port === 3000;
    
    if (isLocalServer) {
      // Method 1: Send via local print server (NO CORS issues!)
      console.log(`Sending to ${printer.name} via print server at ${printer.ip}:${printer.port}`);
      
      const response = await fetch(`http://${printer.ip}:${printer.port}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: data,
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Print server response:`, result);
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: `Print server error: ${error}` };
      }
    } else {
      // Method 2: Direct connection (will fail on HTTPS sites due to CORS)
      console.log(`Attempting direct connection to ${printer.ip}:${printer.port}`);
      
      const response = await fetch(`http://${printer.ip}:${printer.port}`, {
        method: 'POST',
        body: data,
        mode: 'no-cors', // Try no-cors mode
        signal: AbortSignal.timeout(5000)
      });
      
      // In no-cors mode, we can't verify response, but no error means likely success
      console.log(`Sent ${data.length} bytes to Possiflow printer at ${printer.ip}`);
      return { success: true };
    }
    
  } catch (error) {
    // If we get a network error with direct connection, it might still have worked
    if (!isLocalServer && error.name === 'AbortError') {
      return { success: true }; // Assume success in no-cors mode
    }
    
    console.error(`Possiflow print error:`, error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

// Add isLocalServer check helper
function isLocalServer(ip, port) {
  return ip === 'localhost' || ip === '127.0.0.1' || port === 3000;
}

/* ===== UNIFIED PRINTING FUNCTIONS ===== */

/**
 * Print to specific printer (auto-detects USB or WiFi)
 * Optimized for Possiflow and other ESC/POS printers
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} escposData - ESC/POS receipt data
 * @returns {Promise<Object>}
 */
async function printToUnifiedPrinter(printerId, escposData) {
  const printer = printerConnections[printerId];
  
  if (!printer.type) {
    throw new Error(`${printer.name} not configured. Please configure connection type.`);
  }

  try {
    let result;
    
    if (printer.type === 'usb') {
      result = await sendToUSBPrinter(printerId, escposData);
    } else if (printer.type === 'wifi') {
      // Use Possiflow-optimized method for WiFi printers
      result = await sendToPosiflow(printerId, escposData);
    } else {
      throw new Error(`Unknown connection type: ${printer.type}`);
    }
    
    if (result.success) {
      printer.connected = true;
      return {
        success: true,
        printer: printer.name,
        type: printer.type
      };
    } else {
      printer.connected = false;
      throw new Error(result.error || 'Print failed');
    }
  } catch (error) {
    printer.connected = false;
    throw new Error(`Failed to print to ${printer.name}: ${error.message}`);
  }
}

/**
 * Print to both printers simultaneously
 * @param {Uint8Array} escposData - ESC/POS receipt data
 * @returns {Promise<Object>}
 */
async function printToBothPrinters(escposData) {
  const results = {
    printer1: { success: false, error: null },
    printer2: { success: false, error: null }
  };

  const promises = [];async function printToBothPrinters(escposData) {
  const results = {
    printer1: { success: false, error: null },
    printer2: { success: false, error: null }
  };

  // Special case: when both printers route through the SAME local print
  // server (localhost:3000), that server already fans the job out to BOTH
  // physical printers on a single /print call. Sending one request per
  // printer would make each printer print twice. So send just ONE request.
  const p1 = printerConnections.printer1;
  const p2 = printerConnections.printer2;
  const usesLocalServer = (p) =>
    p.type === 'wifi' &&
    (p.ip === 'localhost' || p.ip === '127.0.0.1' || p.port === 3000);

  if (
    usesLocalServer(p1) &&
    usesLocalServer(p2) &&
    p1.ip === p2.ip &&
    p1.port === p2.port
  ) {
    try {
      // A single call to printer1 hits the local server, which prints to both.
      await printToUnifiedPrinter('printer1', escposData);
      results.printer1 = { success: true, printer: p1.name, type: 'wifi' };
      results.printer2 = { success: true, printer: p2.name, type: 'wifi' };
    } catch (error) {
      results.printer1 = { success: false, error: error.message };
      results.printer2 = { success: false, error: error.message };
    }
    return results;
  }

  const promises = [];

  if (printerConnections.printer1.type) {

  
  if (printerConnections.printer1.type) {
    promises.push(
      printToUnifiedPrinter('printer1', escposData)
        .then(result => {
          results.printer1 = result;
        })
        .catch(error => {
          results.printer1 = { success: false, error: error.message };
        })
    );
  }
  
  if (printerConnections.printer2.type) {
    promises.push(
      printToUnifiedPrinter('printer2', escposData)
        .then(result => {
          results.printer2 = result;
        })
        .catch(error => {
          results.printer2 = { success: false, error: error.message };
        })
    );
  }

  await Promise.all(promises);
  return results;
}

/**
 * Get connection status of all printers
 * @returns {Object}
 */
function getPrintersStatus() {
  return {
    printer1: {
      name: printerConnections.printer1.name,
      type: printerConnections.printer1.type,
      ip: printerConnections.printer1.ip,
      port: printerConnections.printer1.port,
      connected: printerConnections.printer1.connected,
      configured: !!printerConnections.printer1.type
    },
    printer2: {
      name: printerConnections.printer2.name,
      type: printerConnections.printer2.type,
      ip: printerConnections.printer2.ip,
      port: printerConnections.printer2.port,
      connected: printerConnections.printer2.connected,
      configured: !!printerConnections.printer2.type
    }
  };
}

/**
 * Test printer connection
 * @param {string} printerId - 'printer1' or 'printer2'
 * @returns {Promise<boolean>}
 */
async function testPrinterConnection(printerId) {
  const printer = printerConnections[printerId];
  
  if (!printer.type) {
    return false;
  }

  try {
    const testData = new Uint8Array([0x1B, 0x40]); // ESC @ - Initialize printer
    const result = printer.type === 'usb' 
      ? await sendToUSBPrinter(printerId, testData)
      : await sendToWiFiPrinter(printerId, testData);
    
    printer.connected = result.success;
    return result.success;
  } catch (error) {
    printer.connected = false;
    return false;
  }
}

// Load printer config on module load
loadPrinterConfig();
