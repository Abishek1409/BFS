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

const PORT = Number(process.env.PORT || 3000);

// Your thermal printers configuration
const PRINTERS = {
  printer1: {
    ip: process.env.PRINTER1_IP || null,
    port: 9100,
    name: 'Printer 1'
  },
  printer2: {
    ip: process.env.PRINTER2_IP || null,
    port: 9100,
    name: 'Printer 2'
  }
};

function createApp({ printers = PRINTERS, send = sendToPrinter, test = testPrinter } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

  app.get('/', (req, res) => {
    res.json({ status: 'running', message: 'Multi-Printer Server', printers });
  });

  app.post(['/print/:printerId', '/print'], async (req, res) => {
    const requestedId = req.params.printerId;
    const targets = requestedId ? [[requestedId, printers[requestedId]]] : Object.entries(printers);
    if (targets.some(([, printer]) => !printer)) {
      res.status(404).json({ success: false, error: 'Unknown printer' });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ success: false, error: 'Print job is empty' });
      return;
    }

    const results = await Promise.all(targets.map(async ([printerId, printer]) => {
      try {
        if (!printer.ip) throw new Error(`${printer.name} IP is not configured`);
        await send(printer, req.body);
        return [printerId, { success: true }];
      } catch (error) {
        return [printerId, { success: false, error: error.message || String(error) }];
      }
    }));
    const byPrinter = Object.fromEntries(results);
    const success = results.every(([, result]) => result.success);
    res.status(success ? 200 : 502).json({
      success,
      message: success ? 'Print job sent' : 'One or more printers failed',
      results: byPrinter
    });
  });

  app.get(['/test/:printerId', '/test'], async (req, res) => {
    const requestedId = req.params.printerId;
    const targets = requestedId ? [[requestedId, printers[requestedId]]] : Object.entries(printers);
    if (targets.some(([, printer]) => !printer)) {
      res.status(404).json({ success: false, error: 'Unknown printer' });
      return;
    }

    const results = await Promise.all(targets.map(async ([printerId, printer]) => {
      try {
        if (!printer.ip) throw new Error(`${printer.name} IP is not configured`);
        await test(printer);
        return [printerId, { success: true, status: 'reachable' }];
      } catch (error) {
        return [printerId, { success: false, error: error.message || String(error) }];
      }
    }));
    const byPrinter = Object.fromEntries(results);
    const success = results.every(([, result]) => result.success);
    res.status(success ? 200 : 502).json({
      success,
      message: success ? 'Printer connection successful' : 'One or more printers unreachable',
      printers: byPrinter
    });
  });

  return app;
}

/**
 * Send data to a single printer
 */
function sendToPrinter(printer, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let settled = false;
    const closeTimer = setTimeout(() => {
      client.destroy();
      finish(new Error('Print transmission timed out'));
    }, 10000);
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(closeTimer);
      if (error) reject(error);
      else resolve({ printer: printer.name, status: 'success' });
    };
    
    client.setTimeout(5000);
    
    client.connect(printer.port, printer.ip, () => {
      console.log(`✓ Connected to ${printer.name} at ${printer.ip}:${printer.port}`);
      client.write(data, error => {
        if (error) {
          client.destroy();
          finish(error);
        } else {
          client.end();
        }
      });
    });
    
    client.on('close', hadError => {
      console.log(`✓ ${printer.name} job completed`);
      if (!hadError) finish();
    });
    
    client.on('error', (err) => {
      console.error(`✗ ${printer.name} error:`, err.message);
      finish(err);
    });
    
    client.on('timeout', () => {
      console.error(`✗ ${printer.name} timeout`);
      client.destroy();
      finish(new Error('Connection timeout'));
    });
  });
}

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

if (require.main === module) {
  if (!PRINTERS.printer1.ip && !PRINTERS.printer2.ip) {
    console.error('Configure PRINTER1_IP and/or PRINTER2_IP before starting the print server.');
    process.exitCode = 1;
  } else {
  const app = createApp();
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
║   GET  /test/printer1|printer2              ║
║   POST /print/printer1|printer2             ║
║   POST /print  - Print to both printers    ║
║                                            ║
╚════════════════════════════════════════════╝

Ready to print to BOTH printers simultaneously!
  `);
  });
  }
}

module.exports = { createApp, PRINTERS, sendToPrinter, testPrinter };