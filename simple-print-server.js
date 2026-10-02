/**
 * SIMPLE Print Server for Possiflow
 * Run this on your computer to bypass CORS
 * 
 * Quick Start:
 * 1. Change PRINTER_IP below to your Possiflow IP
 * 2. Run: node simple-print-server.js
 * 3. Configure website to use: localhost:3000
 */

// ========== CONFIGURATION ==========
const PRINTER_IP = '192.168.1.19';    // ← CHANGE THIS to your Possiflow IP
const PRINTER_PORT = 9100;
const SERVER_PORT = 3000;
// ===================================

const http = require('http');
const net = require('net');

const server = http.createServer((req, res) => {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      printer: `${PRINTER_IP}:${PRINTER_PORT}`,
      message: 'Print server ready'
    }));
    return;
  }
  
  // Test endpoint
  if (req.method === 'GET' && /^\/test(?:\/printer[12])?$/.test(req.url)) {
    const client = new net.Socket();
    client.setTimeout(3000);
    
    client.connect(PRINTER_PORT, PRINTER_IP, () => {
      client.destroy();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Printer reachable' }));
    });
    
    client.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    
    client.on('timeout', () => {
      client.destroy();
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Connection timeout' }));
    });
    return;
  }
  
  // Print endpoint
  if (req.method === 'POST' && /^\/print(?:\/printer[12])?$/.test(req.url)) {
    let body = [];
    
    req.on('data', chunk => {
      body.push(chunk);
    });
    
    req.on('end', () => {
      const data = Buffer.concat(body);
      console.log(`Received ${data.length} bytes to print`);
      
      // Send to printer via TCP
      const client = new net.Socket();
      
      client.connect(PRINTER_PORT, PRINTER_IP, () => {
        console.log(`Connected to printer at ${PRINTER_IP}:${PRINTER_PORT}`);
        client.write(data);
        
        setTimeout(() => {
          client.end();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Print job sent' }));
        }, 2000);
      });
      
      client.on('error', (err) => {
        console.error('Printer error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    });
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(SERVER_PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   POSSIFLOW PRINT SERVER              ║
╠═══════════════════════════════════════╣
║                                       ║
║  Server:  http://localhost:${SERVER_PORT}       ║
║  Printer: ${PRINTER_IP}:${PRINTER_PORT}           ║
║                                       ║
║  Status:  ✓ Running                   ║
║                                       ║
╚═══════════════════════════════════════╝

READY! Now configure your website to use:
  Network Address: localhost
  Port: ${SERVER_PORT}

Test it: http://localhost:${SERVER_PORT}/test
`);
});
