# Possiflow Printer Setup for Vercel (HTTPS Site)

## The Problem

Your billing system is hosted on **Vercel (HTTPS)**, but trying to print to a **local network printer** causes a **CORS error**:
```
Access to fetch at 'http://192.168.1.19:9100/print' has been blocked by CORS policy
```

This happens because browsers block HTTPS websites from accessing local HTTP devices for security.

## The Solution: Local Print Server

Run a simple print server on your local computer/device that acts as a bridge between your Vercel website and the Possiflow printer.

```
Vercel (HTTPS)
    ↓
Local Print Server (HTTP) ← No CORS issues!
    ↓
Possiflow Printer (192.168.1.19)
```

---

## Quick Setup (5 Minutes)

### Step 1: Install Node.js

If you don't have Node.js installed:
- **Windows**: Download from [nodejs.org](https://nodejs.org)
- **Mac**: Download from [nodejs.org](https://nodejs.org)
- **Linux**: `sudo apt install nodejs npm`

### Step 2: Install Dependencies

Open terminal/command prompt in your project folder:

```bash
npm install
```

This installs the required packages (express, cors).

### Step 3: Configure Your Printer IP

The current multi-printer server reads printer addresses from environment variables. In PowerShell, set the relevant address before starting it:

```powershell
$env:PRINTER1_IP = '192.168.1.19'
$env:PRINTER2_IP = '192.168.1.20' # Set this only when using a second printer
```

For Command Prompt, use `set PRINTER1_IP=192.168.1.19` then run `npm start`. Use the printer's real IP addresses. Restart the server whenever you change these values or update `print-server.js`.

If the laptop has a separate copy of this project, replace its `print-server.js` with the updated file from this project and restart the server. The updated server supports separate customer and kitchen jobs; the older broadcast-only server sends the same format to both printers. `localhost` must be configured on the same laptop that runs the browser and print server. If the browser is on a different device, use the laptop's LAN IP instead of `localhost`.

### Step 4: Start the Print Server

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════╗
║   Possiflow Print Server Running!          ║
╠════════════════════════════════════════════╣
║   Server: http://localhost:3000            ║
║   Printer: 192.168.1.19:9100              ║
╚════════════════════════════════════════════╝
```

### Step 5: Configure Your Billing System

1. Go to your Vercel website: `https://bfs-one.vercel.app`
2. Click **⚙️ Configure Printers**
3. For Printer 1:
   - **Name**: Possiflow Printer
   - **Connection Type**: 📡 WiFi Network
   - **Network Address**: **localhost** ← Important!
   - **Port**: **3000** ← The print server port
4. Click **Test WiFi Connection** for each configured printer
5. Click **Save Configuration**

### Step 6: Print!

1. Add items to the bill
2. Click **Print Receipt once**
3. The app sends the customer receipt to Printer 1 and the kitchen ticket to Printer 2 concurrently
4. For one configured printer, only that printer's assigned format prints
5. If one printer fails, choose its Retry action. Clicking Print Receipt again can duplicate the copy that already succeeded.

---

## How It Works

```
Your Browser (Vercel Site)
         ↓ HTTPS (✓ Allowed)
    localhost:3000 (Print Server)
         ↓ TCP Socket
    192.168.1.19:9100 (Possiflow)
         ↓
    🖨️ Receipt Printed!
```

The print server:
1. Runs on your local machine (same device as browser or on local network)
2. Receives print jobs from your Vercel website
3. Forwards them to your Possiflow printer via raw TCP
4. No CORS issues because it's a local server!

---

## Alternative: Keep Server Running

To keep the print server running in the background:

### Windows:
```bash
npm install -g pm2
pm2 start print-server.js
pm2 save
```

### Mac/Linux:
```bash
npm install -g pm2
pm2 start print-server.js
pm2 save
pm2 startup
```

This keeps the server running even after restart.

---

## Testing

### Test 1: Server Running
Open browser: `http://localhost:3000`

Should show:
```json
{
  "status": "running",
  "message": "Possiflow Print Server",
  "printer": "192.168.1.19:9100"
}
```

### Test 2: Printer Connection
Open browser: `http://localhost:3000/test`

Should show:
```json
{
  "success": true,
  "message": "Possiflow printer is reachable"
}
```

If this fails:
- Check Possiflow IP address is correct
- Make sure Possiflow is powered on
- Verify Possiflow is on same network

---

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "Port 3000 already in use"
Change the port in `print-server.js`:
```javascript
const PORT = 3001; // Use different port
```

Then configure billing system to use `localhost:3001`

### "ECONNREFUSED" when testing
- Check Possiflow IP address: `192.168.1.19`
- Make sure Possiflow is powered on
- Print config page from Possiflow to verify IP
- Ping test: `ping 192.168.1.19`

### Print server stops when I close terminal
Use PM2 (see "Keep Server Running" section above) or:
- **Windows**: Minimize the terminal window, don't close it
- **Mac/Linux**: Run with `nohup node print-server.js &`

---

## Configuration for Multiple Devices

If you want to print from multiple tablets/computers:

### Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.50)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address (e.g., 192.168.1.50)

### Update Print Server

In `print-server.js`, change:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // Makes server accessible from other devices
});
```

### Configure Billing System on Other Devices

Use your computer's IP instead of localhost:
- **Network Address**: `192.168.1.50` (your computer's IP)
- **Port**: `3000`

---

## Summary

### On Computer/Device with Print Server:
```bash
# One-time setup
npm install

# Start server
npm start

# Keep running in background
```

### In Your Billing System (Vercel):
```
Printer Configuration (on the same laptop that runs the server):
- Printer 1 Network Address: localhost, Port: 3000
- Printer 2 Network Address: localhost, Port: 3000 (if configured)
```

### Result:
✅ Prints to Possiflow from Vercel without CORS errors!

---

## Files You Need

1. **print-server.js** - The print server code
2. **package.json** - Dependencies configuration
3. **Node.js** - Runtime environment

All included in this project!

---

**Quick Start Command:**
```bash
npm install && npm start
```

That's it! Your Possiflow printer will now work with your Vercel-hosted website. 🎉
