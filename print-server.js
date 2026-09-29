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
    ip: '192.168.1.19',
    port: 9100,
    name: 'Printer 1'
  },
  printer2: {
    ip: '192.168.1.20',
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

// Print to BOTH printers simultaneously
app.post('/print', async (req, res) => {
  try {
    const escposData = req.body;
    
    console.log(`Received print job: ${escposData.length} bytes`);
    console.log('Sending to both printers...');
    
    // Send to both printers in parallel
    const printPromises = Object.entries(PRINTERS).map(([key, printer]) => {
      return sendToPrinter(printer, escposData);
    });
    
    const results = await Promise.allSettled(printPromises);
    
    // Check results
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    if (successful.length === 2) {
      console.log('✅ Both printers printed successfully');
      res.json({ 
        success: true, 
        message: 'Printed to both printers',
        results: {
          printer1: 'success',
          printer2: 'success'
        }
      });
    } else if (successful.length === 1) {
      console.log('⚠️  One printer failed');
      res.json({ 
        success: true, 
        message: 'Printed to one printer (one failed)',
        results: {
          printer1: results[0].status === 'fulfilled' ? 'success' : results[0].reason,
          printer2: results[1].status === 'fulfilled' ? 'success' : results[1].reason
        }
      });
    } else {
      console.log('❌ Both printers failed');
      res.status(500).json({ 
        success: false, 
        message: 'Both printers failed',
        results: {
          printer1: results[0].reason,
          printer2: results[1].reason
        }
      });
    }
    
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Send data to a single printer
 */
function sendToPrinter(printer, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(5000);
    
    client.connect(printer.port, printer.ip, () => {
      console.log(`✓ Connected to ${printer.name} at ${printer.ip}:${printer.port}`);
      client.write(data);
    });
    
    client.on('close', () => {
      console.log(`✓ ${printer.name} job completed`);
      resolve({ printer: printer.name, status: 'success' });
    });
    
    client.on('error', (err) => {
      console.error(`✗ ${printer.name} error:`, err.message);
      reject(err.message);
    });
    
    client.on('timeout', () => {
      console.error(`✗ ${printer.name} timeout`);
      client.destroy();
      reject('Connection timeout');
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      client.end();
    }, 5000);
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