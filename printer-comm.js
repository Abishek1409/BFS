/**
 * Thermal Printer Communication Module
 * Handles Web Serial API communication with ESC/POS thermal printers
 */

// Global reference to connected serial port
let connectedPort = null;
let portWriter = null;
let portReader = null;

// Printer status constants
const PRINTER_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  OFFLINE: 'offline',
  PAPER_OUT: 'paper_out'
};

/**
 * Connect to thermal printer using Web Serial API
 * Requests user to select a serial port and establishes connection
 * @returns {Promise<SerialPort>} Connected serial port reference
 * @throws {Error} If Web Serial API unavailable or connection fails
 */
async function connectThermalPrinter() {
  try {
    // Check if Web Serial API is supported
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported in this browser. Please use Chrome or Edge.');
    }

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
        console.log(`Printer connected at ${baudRate} baud`);
        break;
      } catch (err) {
        console.warn(`Failed to connect at ${baudRate} baud:`, err.message);
        if (port.readable || port.writable) {
          await port.close();
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to establish connection at any baud rate');
    }

    // Store port reference for reuse
    connectedPort = port;
    portWriter = port.writable.getWriter();
    portReader = port.readable.getReader();

    return port;
  } catch (error) {
    connectedPort = null;
    portWriter = null;
    portReader = null;
    
    if (error.name === 'NotFoundError') {
      throw new Error('No printer selected');
    } else if (error.name === 'SecurityError') {
      throw new Error('Permission denied to access printer');
    } else {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }
}

/**
 * Send ESC/POS data to the connected thermal printer
 * Implements chunking for large receipts and timeout handling
 * @param {Uint8Array} data - ESC/POS command byte array
 * @returns {Promise<void>}
 * @throws {Error} If no printer connected or transmission fails
 */
async function sendToPrinter(data) {
  if (!connectedPort || !portWriter) {
    throw new Error('No printer connected. Please connect a printer first.');
  }

  try {
    // Chunk size for transmission (1KB chunks)
    const CHUNK_SIZE = 1024;
    const TIMEOUT_MS = 5000;

    // Split data into chunks for large receipts
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transmission timeout')), TIMEOUT_MS);
      });

      // Write chunk with timeout
      const writePromise = portWriter.write(chunk);
      
      await Promise.race([writePromise, timeoutPromise]);
    }

    // Wait for data to be fully transmitted
    await portWriter.ready;
    
    console.log(`Successfully sent ${data.length} bytes to printer`);
  } catch (error) {
    if (error.message === 'Transmission timeout') {
      throw new Error('Printer not responding. Check connection and try again.');
    } else if (error.name === 'NetworkError') {
      throw new Error('Printer disconnected during transmission');
    } else {
      throw new Error(`Print failed: ${error.message}`);
    }
  }
}

/**
 * Query printer status and detect common error conditions
 * @returns {Promise<Object>} Status object with connection and readiness info
 * @property {string} status - Current printer status (connected, offline, etc.)
 * @property {boolean} connected - Whether printer is connected
 * @property {boolean} ready - Whether printer is ready to print
 * @property {string} message - Human-readable status message
 */
async function getPrinterStatus() {
  // Check if printer is connected
  if (!connectedPort) {
    return {
      status: PRINTER_STATUS.DISCONNECTED,
      connected: false,
      ready: false,
      message: 'No printer connected'
    };
  }

  try {
    // Check if port is still open
    if (!connectedPort.readable || !connectedPort.writable) {
      connectedPort = null;
      portWriter = null;
      portReader = null;
      
      return {
        status: PRINTER_STATUS.OFFLINE,
        connected: false,
        ready: false,
        message: 'Printer is offline or disconnected'
      };
    }

    // ESC/POS command to query printer status (DLE EOT n)
    const DLE = 0x10;
    const EOT = 0x04;
    const statusQuery = new Uint8Array([DLE, EOT, 0x01]); // Query printer status

    try {
      // Send status query
      await portWriter.write(statusQuery);
      await portWriter.ready;

      // Try to read response with timeout
      const readTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Status read timeout')), 1000);
      });

      const readPromise = portReader.read();
      const result = await Promise.race([readPromise, readTimeout]);

      if (result.value && result.value.length > 0) {
        const statusByte = result.value[0];
        
        // Check status bits (ESC/POS standard)
        const isOffline = (statusByte & 0x08) !== 0;
        const isPaperOut = (statusByte & 0x20) !== 0;

        if (isPaperOut) {
          return {
            status: PRINTER_STATUS.PAPER_OUT,
            connected: true,
            ready: false,
            message: 'Printer is out of paper'
          };
        }

        if (isOffline) {
          return {
            status: PRINTER_STATUS.OFFLINE,
            connected: true,
            ready: false,
            message: 'Printer is offline'
          };
        }
      }
    } catch (statusError) {
      // If status query fails, assume printer is still connected but status unknown
      console.warn('Could not query printer status:', statusError.message);
    }

    // If we got here, printer appears connected and ready
    return {
      status: PRINTER_STATUS.CONNECTED,
      connected: true,
      ready: true,
      message: 'Printer is ready'
    };

  } catch (error) {
    return {
      status: PRINTER_STATUS.ERROR,
      connected: false,
      ready: false,
      message: `Status check failed: ${error.message}`
    };
  }
}

/**
 * Disconnect from the thermal printer and release resources
 * @returns {Promise<void>}
 */
async function disconnectPrinter() {
  try {
    if (portWriter) {
      portWriter.releaseLock();
      portWriter = null;
    }

    if (portReader) {
      portReader.releaseLock();
      portReader = null;
    }

    if (connectedPort) {
      await connectedPort.close();
      connectedPort = null;
    }

    console.log('Printer disconnected successfully');
  } catch (error) {
    console.error('Error during disconnect:', error);
    // Force reset references even if close fails
    connectedPort = null;
    portWriter = null;
    portReader = null;
  }
}

/**
 * Check if a printer is currently connected
 * @returns {boolean} True if printer is connected
 */
function isConnected() {
  return connectedPort !== null && portWriter !== null;
}

/**
 * Get connected port information
 * @returns {Object|null} Port info or null if not connected
 */
function getPortInfo() {
  if (!connectedPort) {
    return null;
  }

  const info = connectedPort.getInfo();
  return {
    usbVendorId: info.usbVendorId,
    usbProductId: info.usbProductId
  };
}
