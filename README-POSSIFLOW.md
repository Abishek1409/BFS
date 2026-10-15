# ✅ Solution for Your Possiflow Printer

## Problem
You're getting this error:
```
Access to fetch at 'http://192.168.1.19:9100/print' from origin 'https://bfs-one.vercel.app' 
has been blocked by CORS policy
```

**Why?** Your site is on HTTPS (Vercel) but trying to print to local HTTP printer = CORS security block.

---

## ⚡ Quick Fix (3 Steps)

### 1. Install Node.js
Download from: https://nodejs.org
(If already installed, skip to step 2)

### 2. Run Print Server
Open terminal in your project folder:
```bash
npm install
npm start
```

You'll see:
```
Possiflow Print Server Running!
Server: http://localhost:3000
Printer: 192.168.1.19:9100
```

✅ **Keep this terminal window open!**

### 3. Configure Your Website
Go to https://bfs-one.vercel.app

1. Click **⚙️ Configure Printers**
2. Printer 1 settings:
   - Name: `Possiflow Printer`
   - Connection Type: **📡 WiFi Network**
   - Network Address: **localhost**
   - Port: **3000**
3. Click **Test WiFi Connection** ✅
4. Click **Save Configuration**

### 4. Print!
- Add items to bill
- Click **Print Receipt**
- Your Possiflow prints! 🎉

---

## How It Works

```
Your Browser (Vercel)
    ↓ HTTPS (No CORS)
Local Print Server (localhost:3000)
    ↓ Direct TCP
Possiflow Printer (192.168.1.19:9100)
    ↓
🖨️ PRINTED!
```

The print server runs on your computer and acts as a bridge!

---

## Keep Server Running

### Start on Boot (Windows)
```bash
npm install -g pm2
pm2 start print-server.js
pm2 save
pm2 startup
```

### Start on Boot (Mac/Linux)
```bash
npm install -g pm2
pm2 start print-server.js
pm2 save
pm2 startup
```

---

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Port 3000 in use"
Edit `print-server.js`, change:
```javascript
const PORT = 3001; // Use different port
```
Then use `localhost:3001` in your website config

### "ECONNREFUSED"
- Check Possiflow IP: Edit `print-server.js`, update `POSSIFLOW_IP`
- Make sure Possiflow is powered on
- Test: `ping 192.168.1.19`

---

## Files Provided

- ✅ `print-server.js` - The print server
- ✅ `package.json` - Dependencies
- ✅ `POSSIFLOW-SETUP.md` - Detailed guide

---

## One-Command Setup

```bash
npm install && npm start
```

Then configure website to use **localhost:3000**

---

**That's it!** Your Possiflow now works with Vercel! 🚀
