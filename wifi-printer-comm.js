/**
 * WiFi Thermal Printer Communication Module
 * Handles network communication with ESC/POS thermal printers via TCP/IP
 * Supports multiple printers simultaneously
 */

// Printer connection state
const printerConnections = {
  printer1: {
    ip: null,
    port: 9100, // Standard ESC/POS port
    name: 'Printer 1',
    connected: false,
    socket: null
  },
  printer2: {
    ip: null,
    port: 9100,
    name: 'Printer 2',
    connected: false,
    socket: null
  }
};

/**
 * Load printer configurations from localStorage
 */
function loadPrinterConfig() {
  try {
    const config = localStorage.getItem('bfsPrinterConfig');
    if (config) {
      const parsed = JSON.parse(config);
      if (parsed.printer1) {
        printerConnections.printer1.ip = parsed.printer1.ip;
        printerConnections.printer1.port = parsed.printer1.port || 9100;
        printerConnections.printer1.name = parsed.printer1.name || 'Printer 1';
      }
      if (parsed.printer2) {
        printerConnections.printer2.ip = parsed.printer2.ip;
        printerConnections.printer2.port = parsed.printer2.port || 9100;
        printerConnections.printer2.name = parsed.printer2.name || 'Printer 2';
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
        ip: printerConnections.printer1.ip,
        port: printerConnections.printer1.port,
        name: printerConnections.printer1.name
      },
      printer2: {
        ip: printerConnections.printer2.ip,
        port: printerConnections.printer2.port,
        name: printerConnections.printer2.name
      }
    };
    localStorage.setItem('bfsPrinterConfig', JSON.stringify(config));
    console.log('Saved printer configuration');
  } catch (error) {
    console.error('Failed to save printer config:', error);
  }
}

/**
 * Connect to a WiFi thermal printer
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {string} ip - Printer IP address
 * @param {number} port - Printer port (default 9100)
 * @returns {Promise<boolean>} Connection success status
 */
async function connectWiFiPrinter(printerId, ip, port = 9100) {
  const printer = printerConnections[printerId];
  
  if (!printer) {
    throw new Error(`Invalid printer ID: ${printerId}`);
  }

  // Update printer config
  printer.ip = ip;
  printer.port = port;
  
  try {
    // Test connection by sending a simple status query
    const testResult = await sendToPrinterHTTP(printerId, new Uint8Array([0x10, 0x04, 0x01]));
    
    if (testResult.success) {
      printer.connected = true;
      savePrinterConfig();
      console.log(`${printer.name} connected successfully at ${ip}:${port}`);
      return true;
    } else {
      throw new Error(testResult.error || 'Connection test failed');
    }
  } catch (error) {
    printer.connected = false;
    throw new Error(`Failed to connect to ${printer.name}: ${error.message}`);
  }
}

/**
 * Send ESC/POS data to WiFi printer via HTTP POST
 * This is compatible with most WiFi thermal printers that expose an HTTP endpoint
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} data - ESC/POS command bytes
 * @returns {Promise<Object>} Result object with success status
 */
async function sendToPrinterHTTP(printerId, data) {
  const printer = printerConnections[printerId];
  
  if (!printer || !printer.ip) {
    return {
      success: false,
      error: `${printer ? printer.name : 'Printer'} not configured`
    };
  }

  try {
    // Convert Uint8Array to base64 for transmission
    const base64Data = btoa(String.fromCharCode.apply(null, data));
    
    // Send to printer via HTTP POST
    // Most WiFi thermal printers accept raw ESC/POS data at /cgi-bin/epos/service.cgi or similar
    const response = await fetch(`http://${printer.ip}:${printer.port}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: data,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      console.log(`Sent ${data.length} bytes to ${printer.name}`);
      return { success: true };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error(`Failed to send to ${printer.name}:`, error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * Send data to printer using raw TCP socket (for Android apps with socket access)
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} data - ESC/POS command bytes
 * @returns {Promise<Object>} Result object
 */
async function sendToPrinterSocket(printerId, data) {
  const printer = printerConnections[printerId];
  
  if (!printer || !printer.ip) {
    return {
      success: false,
      error: `${printer ? printer.name : 'Printer'} not configured`
    };
  }

  // Check if Chrome Sockets API is available (for Chromebooks)
  if (typeof chrome !== 'undefined' && chrome.sockets && chrome.sockets.tcp) {
    return await sendViaChromeSocket(printerId, data);
  }
  
  // Fallback to HTTP method
  return await sendToPrinterHTTP(printerId, data);
}

/**
 * Send via Chrome Sockets API (Chromebooks)
 */
async function sendViaChromeSocket(printerId, data) {
  const printer = printerConnections[printerId];
  
  return new Promise((resolve) => {
    chrome.sockets.tcp.create({}, (createInfo) => {
      const socketId = createInfo.socketId;
      
      chrome.sockets.tcp.connect(socketId, printer.ip, printer.port, (result) => {
        if (result < 0) {
          chrome.sockets.tcp.close(socketId);
          resolve({
            success: false,
            error: `Connection failed: ${result}`
          });
          return;
        }
        
        chrome.sockets.tcp.send(socketId, data.buffer, (sendInfo) => {
          chrome.sockets.tcp.close(socketId);
          
          if (sendInfo.resultCode < 0) {
            resolve({
              success: false,
              error: `Send failed: ${sendInfo.resultCode}`
            });
          } else {
            resolve({ success: true });
          }
        });
      });
    });
  });
}

/**
 * Print to specific printer
 * @param {string} printerId - 'printer1' or 'printer2'
 * @param {Uint8Array} escposData - ESC/POS receipt data
 * @returns {Promise<Object>} Print result
 */
async function printToWiFiPrinter(printerId, escposData) {
  const printer = printerConnections[printerId];
  
  if (!printer) {
    throw new Error(`Invalid printer: ${printerId}`);
  }
  
  if (!printer.ip) {
    throw new Error(`${printer.name} not configured. Please set IP address.`);
  }

  try {
    // Try socket method first (better for local network)
    let result = await sendToPrinterSocket(printerId, escposData);
    
    // If socket fails, try HTTP
    if (!result.success) {
      console.warn(`Socket send failed for ${printer.name}, trying HTTP...`);
      result = await sendToPrinterHTTP(printerId, escposData);
    }
    
    if (result.success) {
      printer.connected = true;
      return {
        success: true,
        printer: printer.name
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
 * @returns {Promise<Object>} Results from both printers
 */
async function printToBothPrinters(escposData) {
  const results = {
    printer1: { success: false, error: null },
    printer2: { success: false, error: null }
  };

  // Print to both printers in parallel
  const promises = [];
  
  if (printerConnections.printer1.ip) {
    promises.push(
      printToWiFiPrinter('printer1', escposData)
        .then(result => {
          results.printer1 = result;
        })
        .catch(error => {
          results.printer1 = { success: false, error: error.message };
        })
    );
  }
  
  if (printerConnections.printer2.ip) {
    promises.push(
      printToWiFiPrinter('printer2', escposData)
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
 * @returns {Object} Status of both printers
 */
function getPrintersStatus() {
  return {
    printer1: {
      name: printerConnections.printer1.name,
      ip: printerConnections.printer1.ip,
      port: printerConnections.printer1.port,
      connected: printerConnections.printer1.connected,
      configured: !!printerConnections.printer1.ip
    },
    printer2: {
      name: printerConnections.printer2.name,
      ip: printerConnections.printer2.ip,
      port: printerConnections.printer2.port,
      connected: printerConnections.printer2.connected,
      configured: !!printerConnections.printer2.ip
    }
  };
}

/**
 * Test printer connection
 * @param {string} printerId - 'printer1' or 'printer2'
 * @returns {Promise<boolean>} Connection test result
 */
async function testPrinterConnection(printerId) {
  const printer = printerConnections[printerId];
  
  if (!printer || !printer.ip) {
    return false;
  }

  try {
    // Send a test pattern (initialize printer command)
    const testData = new Uint8Array([0x1B, 0x40]); // ESC @ - Initialize printer
    const result = await sendToPrinterSocket(printerId, testData);
    
    printer.connected = result.success;
    return result.success;
  } catch (error) {
    printer.connected = false;
    return false;
  }
}

// Load printer config on module load
loadPrinterConfig();
