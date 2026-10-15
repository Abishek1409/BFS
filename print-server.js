/**
 * Local Print Server for Multiple Thermal Printers
 * Bypasses CORS restrictions by running locally
 * 
 * How to use:
 * 1. Install: npm install express cors
 * 2. Run: node print-server.js
 * 3. Server runs at http://localhost:3000
 * 4. Configure your app to use http://localhost:3000 as printer address
 */

const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const PORT = 3000;

// Your thermal printers configuration
const PRINTERS = {
  printer1: {
    ip: '192.168.0.202',
    port: 9100,
    name: 'Printer 1'
  },
  printer2: {
    ip: '192.168.0.200',
    port: 9100,
    name: 'Printer 2'
  }
};

// Enable CORS for all origins (allows browser to connect)
app.use(cors());

// Parse binary data
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Multi-Printer Server',
    printers: PRINTERS
  });
});

// Only allow forwarding to private LAN printers (prevents use as an open relay)
function isPrivateIPv4(ip) {
  return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(ip);
}

// POST /print                      -> print to BOTH configured printers
// POST /print?ip=192.168.1.8&port=9100 -> print to that ONE printer
// The data is written over a raw TCP socket, so no HTTP headers reach the printer.
app.post('/print', async (req, res) => {
  try {
    const escposData = req.body;
    if (!escposData || !escposData.length) {
      return res.status(400).json({ success: false, error: 'Empty print job' });
    }

    let targets;
    if (req.query.ip) {
      const ip = String(req.query.ip);
      const port = parseInt(req.query.port, 10) || 9100;
      if (!isPrivateIPv4(ip) || port < 1 || port > 65535) {
        return res.status(400).json({ success: false, error: 'Invalid printer address' });
      }
      targets = [{ ip, port, name: `Printer ${ip}` }];
    } else {
      targets = Object.values(PRINTERS);
    }

    console.log(`Received print job: ${escposData.length} bytes -> ${targets.map(t => t.ip).join(', ')}`);

    const results = await Promise.allSettled(targets.map(t => sendToPrinter(t, escposData)));
    const okCount = results.filter(r => r.status === 'fulfilled').length;
    const details = results.map((r, i) => ({
      ip: targets[i].ip,
      status: r.status === 'fulfilled' ? 'success' : String(r.reason)
    }));

    if (okCount > 0) {
      console.log(`✅ Printed on ${okCount}/${targets.length} printer(s)`);
      res.json({ success: true, printed: okCount, total: targets.length, results: details });
    } else {
      console.log('❌ All printers failed:', details);
      res.status(502).json({ success: false, error: 'Printer unreachable', results: details });
    }
  } catch (error) {
    console.error('Print error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/**
 * Send data to a single printer
 */
function sendToPrinter(printer, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(4000); // Fail fast if the printer is off/unreachable
    
    client.connect(printer.port, printer.ip, () => {
      console.log(`✓ Connected to ${printer.name} at ${printer.ip}:${printer.port}`);
      
      // Write only the actual ESC/POS data, nothing else
      client.write(data, (err) => {
        if (err) {
          console.error(`✗ ${printer.name} write error:`, err.message);
          client.destroy();
          reject(err.message);
        } else {
          console.log(`✓ ${printer.name} data sent successfully`);
          // Close connection immediately after successful write
          client.end();
        }
      });
    });
    
    client.on('close', () => {
      console.log(`✓ ${printer.name} connection closed`);
      resolve({ printer: printer.name, status: 'success' });
    });
    
    client.on('error', (err) => {
      console.error(`✗ ${printer.name} error:`, err.message);
      client.destroy();
      reject(err.message);
    });
    
    client.on('timeout', () => {
      console.error(`✗ ${printer.name} timeout`);
      client.destroy();
      reject('Connection timeout');
    });
  });
}

// Test endpoint - tests both printers
app.get('/test', async (req, res) => {
  try {
    console.log('Testing both printers...');
    
    const testPromises = Object.entries(PRINTERS).map(([key, printer]) => {
      return testPrinter(printer);
    });
    
    const results = await Promise.allSettled(testPromises);
    
    const response = {
      printer1: results[0].status === 'fulfilled' ? 'reachable' : results[0].reason,
      printer2: results[1].status === 'fulfilled' ? 'reachable' : results[1].reason
    };
    
    const allReachable = results.every(r => r.status === 'fulfilled');
    
    if (allReachable) {
      res.json({ success: true, message: 'Both printers are reachable', printers: response });
    } else {
      res.status(500).json({ success: false, message: 'One or more printers unreachable', printers: response });
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Test connection to a single printer
 */
function testPrinter(printer) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(3000);
    
    client.connect(printer.port, printer.ip, () => {
      console.log(`✓ ${printer.name} is reachable`);
      client.destroy();
      resolve(printer.name);
    });
    
    client.on('error', (err) => {
      console.error(`✗ ${printer.name} unreachable:`, err.message);
      reject(err.message);
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject('Connection timeout');
    });
  });
}

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Multi-Printer Server Running!            ║
╠════════════════════════════════════════════╣
║                                            ║
║   Server: http://localhost:${PORT}            ║
║                                            ║
║   Printer 1: ${PRINTERS.printer1.ip}:${PRINTERS.printer1.port}              ║
║   Printer 2: ${PRINTERS.printer2.ip}:${PRINTERS.printer2.port}              ║
║                                            ║
║   Endpoints:                               ║
║   GET  /       - Server status             ║
║   GET  /test   - Test both printers        ║
║   POST /print  - Print to both printers    ║
║                                            ║
╚════════════════════════════════════════════╝

Ready to print to BOTH printers simultaneously!
  `);
});