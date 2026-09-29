/**
 * Local Print Server for Possiflow Printer
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

// Your Possiflow printer IP and port
const POSSIFLOW_IP = '192.168.1.19';
const POSSIFLOW_PORT = 9100;

// Enable CORS for all origins (allows Vercel site to connect)
app.use(cors());

// Parse binary data
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Possiflow Print Server',
    printer: `${POSSIFLOW_IP}:${POSSIFLOW_PORT}`
  });
});

// Print endpoint
app.post('/print', async (req, res) => {
  try {
    const escposData = req.body;
    
    console.log(`Received print job: ${escposData.length} bytes`);
    
    // Send to Possiflow printer via raw TCP socket
    const client = new net.Socket();
    
    client.connect(POSSIFLOW_PORT, POSSIFLOW_IP, () => {
      console.log(`Connected to Possiflow at ${POSSIFLOW_IP}:${POSSIFLOW_PORT}`);
      client.write(escposData);
    });
    
    client.on('data', (data) => {
      console.log('Received from printer:', data);
    });
    
    client.on('close', () => {
      console.log('Print job completed');
      res.json({ success: true, message: 'Print job sent to Possiflow' });
    });
    
    client.on('error', (err) => {
      console.error('Printer error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      client.end();
    }, 5000);
    
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  const client = new net.Socket();
  
  client.setTimeout(3000);
  
  client.connect(POSSIFLOW_PORT, POSSIFLOW_IP, () => {
    console.log('Test connection successful');
    client.destroy();
    res.json({ success: true, message: 'Possiflow printer is reachable' });
  });
  
  client.on('error', (err) => {
    console.error('Test connection failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  });
  
  client.on('timeout', () => {
    client.destroy();
    res.status(500).json({ success: false, error: 'Connection timeout' });
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Possiflow Print Server Running!          ║
╠════════════════════════════════════════════╣
║                                            ║
║   Server: http://localhost:${PORT}            ║
║   Printer: ${POSSIFLOW_IP}:${POSSIFLOW_PORT}              ║
║                                            ║
║   Endpoints:                               ║
║   GET  /       - Server status             ║
║   GET  /test   - Test printer connection   ║
║   POST /print  - Send print job            ║
║                                            ║
╚════════════════════════════════════════════╝

Ready to receive print jobs from Vercel!
  `);
});
