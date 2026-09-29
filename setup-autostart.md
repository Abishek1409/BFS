# Auto-Start Print Server Setup

## The Goal
Make the print server start automatically when your computer boots - no manual commands needed!

---

## Windows Setup (PM2 Method - EASIEST)

### Step 1: Install PM2
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

### Step 2: Configure PM2
```cmd
pm2-startup install
```

### Step 3: Start Print Server
```cmd
pm2 start simple-print-server.js --name "possiflow-printer"
pm2 save
```

### Step 4: Test
Restart your computer. The print server should start automatically!

Check status:
```cmd
pm2 status
```

---

## Mac/Linux Setup (PM2 Method)

### Step 1: Install PM2
```bash
npm install -g pm2
```

### Step 2: Start Print Server
```bash
pm2 start simple-print-server.js --name "possiflow-printer"
pm2 save
```

### Step 3: Enable Startup
```bash
pm2 startup
```

Copy and run the command it shows (will ask for sudo password)

### Step 4: Test
```bash
# Check it's running
pm2 status

# Restart computer
sudo reboot

# After restart, check again
pm2 status
```

---

## Windows Setup (Alternative: Task Scheduler)

### Step 1: Create Batch File

Create `start-print-server.bat`:
```batch
@echo off
cd /d "%~dp0"
node simple-print-server.js
```

### Step 2: Setup Task Scheduler

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click "Create Basic Task"
3. Name: "Possiflow Print Server"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\path\to\your\start-print-server.bat`
7. Finish

### Step 3: Test
Restart computer. Check Task Manager for `node.exe` process.

---

## Windows Setup (Alternative: Startup Folder)

### Step 1: Create VBS Script

Create `start-print-server-hidden.vbs`:
```vbscript
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\path\to\your\project && node simple-print-server.js", 0, False
Set WshShell = Nothing
```

### Step 2: Add to Startup

1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. Copy the VBS file into this folder

### Step 3: Test
Restart computer. Print server runs in background (no window).

---

## PM2 Management Commands

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs possiflow-printer
```

### Restart
```bash
pm2 restart possiflow-printer
```

### Stop
```bash
pm2 stop possiflow-printer
```

### Remove from Startup
```bash
pm2 delete possiflow-printer
pm2 save
```

---

## Verification

After setup, verify it's working:

1. **Restart your computer**

2. **Open browser:** `http://localhost:3000/test`
   - Should show: `{"success":true}`

3. **Check PM2 status:** `pm2 status`
   - Should show: `online`

4. **Print a test receipt**
   - Should work automatically!

---

## Troubleshooting

### PM2 not found after restart
Your PATH might not include npm global packages.

**Windows Fix:**
Add to System PATH: `C:\Users\YourName\AppData\Roaming\npm`

**Mac/Linux Fix:**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$PATH:/usr/local/bin"
```

### Print server not starting
Check PM2 logs:
```bash
pm2 logs possiflow-printer --lines 50
```

### Port 3000 already in use
Check what's using it:
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

---

## Benefits of Auto-Start

✅ **No daily commands** - Start once, works forever  
✅ **Survives restarts** - Auto-starts after power outage  
✅ **Runs in background** - No terminal window needed  
✅ **Easy management** - Simple PM2 commands  
✅ **Monitoring** - PM2 restarts if it crashes  

---

## Updating Printer IP

If your Possiflow IP changes:

1. Edit `simple-print-server.js`
2. Change `PRINTER_IP`
3. Restart:
```bash
pm2 restart possiflow-printer
```

Done! No need to reconfigure anything else.

---

**Recommended:** Use PM2 method - it's the most reliable and easiest to manage! 🚀
