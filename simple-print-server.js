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
// Listen on this computer only (set HOST=0.0.0.0 to share it on the network on purpose)
const HOST = process.env.HOST || '127.0.0.1';
// Only the billing website may use this server from a browser; other sites are refused.
// Add more with ALLOWED_ORIGINS="https://a.example,https://b.example".
const ALLOWED_ORIGINS = ['https://bfs-one.vercel.app'].concat(
  String(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
);
// Raw printing ports only (JetDirect 9100-9102)
const PRINTER_PORTS = new Set([9100, 9101, 9102]);
// ===================================

const http = require('http');
const net = require('net');

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

function originAllowed(origin) {
  if (!origin) return true;            // not a browser page (curl, local tools)
  if (origin === 'null') return true;  // billing page opened from a local file
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || ALLOWED_ORIGINS.includes(origin);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  // Refuse browser requests from any site except the billing website
  const origin = req.headers.origin;
  if (!originAllowed(origin)) {
    sendJson(res, 403, { success: false, error: 'Origin not allowed' });
    return;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Chrome asks HTTPS sites for permission before calling localhost
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  
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
  
  // Print to the printer IP set in the website: POST /print-to?ip=192.168.1.8&port=9100
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/print-to') {
    const ip = url.searchParams.get('ip') || '';
    const port = Number(url.searchParams.get('port') || 9100);
    // Only local network printers, so this cannot be used to reach the internet
    if (!isPrivateIPv4(ip) || !PRINTER_PORTS.has(port)) {
      sendJson(res, 400, { success: false, error: 'Invalid printer address' });
      return;
    }
    const body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const data = Buffer.concat(body);
      if (data.length === 0) {
        sendJson(res, 400, { success: false, error: 'Print job is empty' });
        return;
      }
      const client = new net.Socket();
      let done = false;
      const finish = (status, payload) => {
        if (done) return;
        done = true;
        sendJson(res, status, payload);
      };
      client.setTimeout(5000);
      client.connect(port, ip, () => {
        // Reply once bytes are flushed; printers often never close their side
        client.end(data, () => {
          console.log(`Sent ${data.length} bytes to ${ip}:${port}`);
          finish(200, { success: true, message: 'Print job sent' });
          setTimeout(() => client.destroy(), 1000);
        });
      });
      client.on('error', err => {
        console.error(`Printer ${ip} error:`, err.message);
        finish(502, { success: false, error: err.message });
      });
      client.on('timeout', () => {
        client.destroy();
        finish(502, { success: false, error: `Printer ${ip} not responding` });
      });
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

server.listen(SERVER_PORT, HOST, () => {
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
