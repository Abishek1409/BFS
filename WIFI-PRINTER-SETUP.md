# WiFi Thermal Printer Setup Guide
## Best Fruits Stall - Dual Printer Configuration

### Overview
The billing system now supports **two WiFi thermal printers** simultaneously. Browser print functionality has been removed - the system is designed exclusively for WiFi-connected ESC/POS thermal printers.

---

## Features

✅ **Dual Printer Support** - Print to two printers at the same time  
✅ **WiFi/Network Connection** - No USB required, works over local network  
✅ **Tablet Compatible** - Designed for Android/iOS tablets  
✅ **ESC/POS Standard** - Compatible with most thermal printers  
✅ **Auto-Configuration** - Saves printer settings in browser storage  
✅ **Status Indicators** - Real-time connection status for both printers  

---

## Supported Printers

The system works with any ESC/POS thermal printer that supports:
- WiFi/Network connectivity
- Raw TCP/IP printing on port 9100 (default)
- Standard ESC/POS commands

### Tested Printer Brands:
- Epson (TM series)
- Star Micronics
- Citizen
- Bixolon
- Xprinter
- Generic ESC/POS WiFi printers

---

## Prerequisites

### 1. Printer Setup
Each thermal printer must be:
1. **Connected to WiFi** - Follow your printer's manual to connect to your local network
2. **Assigned a static IP** - Use your router's DHCP reservation to assign fixed IPs
3. **Configured for ESC/POS** - Most thermal printers are pre-configured for ESC/POS
4. **Port 9100 enabled** - This is the standard ESC/POS raw printing port

### 2. Network Setup
- All devices (tablet + printers) must be on the **same local network**
- Firewalls should allow communication on port 9100
- For best performance, use a dedicated WiFi network for POS devices

### 3. Tablet/Device Requirements
- Modern web browser (Chrome, Edge, Safari recommended)
- Local network access
- JavaScript enabled

---

## Configuration

### Step 1: Access Printer Configuration
1. Open the billing system in your browser
2. Look for the **WiFi Printer Status** section in the billing panel
3. Click **⚙️ Configure Printers** button

### Step 2: Configure Printer 1
1. **Name**: Enter a descriptive name (e.g., "Counter Printer", "Kitchen Printer")
2. **IP Address**: Enter the printer's local IP (e.g., `192.168.1.100`)
3. **Port**: Leave as `9100` (default for ESC/POS printers)
4. Click **Test Printer 1 Connection** to verify

### Step 3: Configure Printer 2
1. **Name**: Enter a descriptive name for the second printer
2. **IP Address**: Enter the second printer's IP (e.g., `192.168.1.101`)
3. **Port**: Leave as `9100`
4. Click **Test Printer 2 Connection** to verify

### Step 4: Save Configuration
- Click **Save Configuration**
- Settings are saved to browser's local storage
- Configuration persists across browser restarts

---

## Finding Your Printer's IP Address

### Method 1: Printer Test Print
Most thermal printers can print a network configuration page:
1. Turn off the printer
2. Hold the FEED button
3. Turn on the printer while holding FEED
4. A configuration page will print showing the IP address

### Method 2: Router Admin Panel
1. Access your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "Connected Devices" or "DHCP Client List"
3. Find your printer by name or MAC address
4. Note the assigned IP address

### Method 3: Network Scanner App
Use a network scanner app on your tablet:
- **Android**: Fing, Network Scanner
- **iOS**: Fing, Network Analyzer
- Look for devices on port 9100

---

## Usage

### Printing a Bill
1. Add items to the bill as usual
2. Fill in bill number and customer name (optional)
3. Click **Print Receipt** button
4. The system will:
   - Generate the ESC/POS receipt data
   - Send to both configured printers simultaneously
   - Show success/failure status for each printer

### Status Indicators
- **Green dot** 🟢 - Printer connected and ready
- **Gray dot** ⚪ - Printer not configured or disconnected
- **IP Address displayed** - Printer configured
- **"Not configured"** - Printer needs setup

---

## Troubleshooting

### Printer Not Responding

**Problem**: Print button shows error or printer doesn't print

**Solutions**:
1. **Check Network Connection**
   - Ensure printer is powered on
   - Verify printer is connected to WiFi (check printer's LCD/LED)
   - Ping the printer IP from your tablet: `ping 192.168.1.100`

2. **Verify IP Address**
   - Print a network configuration page from the printer
   - Confirm the IP matches your configuration
   - Check if IP changed (use DHCP reservation to prevent this)

3. **Test Connection**
   - Go to Configure Printers
   - Click "Test Printer Connection" for each printer
   - Review any error messages

4. **Check Port Number**
   - Most printers use port 9100
   - Some models may use 8 08, 9101, or other ports
   - Check printer documentation

### Only One Printer Working

**Problem**: One printer prints successfully, the other fails

**Solutions**:
1. Each printer must have a **unique IP address**
2. Test the non-working printer individually in configuration
3. Check if the printer is in an error state (paper jam, cover open, etc.)
4. Power cycle the non-working printer

### Slow Printing

**Problem**: Printing takes a long time

**Solutions**:
1. **Network Congestion** - Move POS devices to dedicated WiFi network
2. **Weak Signal** - Move printer closer to WiFi router
3. **Printer Buffer** - Some printers have slow processors, this is normal

### Browser Compatibility Issues

**Problem**: Configuration modal doesn't show or errors occur

**Solutions**:
1. Use Chrome or Edge browser (best support)
2. Clear browser cache and reload
3. Ensure JavaScript is enabled
4. Check browser console for errors (F12 → Console tab)

---

## Advanced Configuration

### Changing Printer Port
If your printer uses a non-standard port:
1. Open Configure Printers
2. Change the Port field (e.g., `9101`, `8008`)
3. Test the connection
4. Save configuration

### Using Only One Printer
If you only have one printer:
1. Configure Printer 1 only
2. Leave Printer 2 fields empty
3. The system will only print to Printer 1

### Static IP Assignment (Recommended)
To prevent IP address changes:

#### On Your Router:
1. Access router admin panel
2. Find "DHCP Reservation" or "Static DHCP"
3. Assign fixed IPs to each printer by MAC address
4. Recommended:
   - Printer 1: `192.168.1.100`
   - Printer 2: `192.168.1.101`

#### On the Printer (if supported):
1. Access printer's network settings
2. Change from DHCP to Static IP
3. Set IP, Subnet Mask, Gateway manually
4. Refer to your printer's manual

---

## Technical Details

### Communication Method
- **Primary**: HTTP POST to `http://[PRINTER_IP]:[PORT]/print`
- **Fallback**: Raw TCP socket (Chrome Sockets API on Chromebooks)
- **Data Format**: ESC/POS commands as binary data (Uint8Array)

### ESC/POS Commands Used
- Text formatting (bold, alignment, sizing)
- Box-drawing characters for preferences (■ □ ◧ ▦)
- Line feeds and cuts
- Character encoding (UTF-8 with ASCII fallback)

### Printer Detection
The system uses these common ESC/POS vendor IDs:
- `0x04b8` - Epson
- `0x0483` - Star Micronics
- `0x1504` - Citizen
- `0x0416` - Bixolon
- `0x1CB0` - Xprinter
- `0x0525` - Generic POS

### Data Storage
- Printer configuration stored in `localStorage` under key `bfsPrinterConfig`
- Persists across browser sessions
- Cleared if browser data is cleared

---

## Security Considerations

### Local Network Only
- Printers should be on a **private local network**
- Do NOT expose printers directly to the internet
- Use a separate WiFi network for POS devices if possible

### Firewall Rules
- Allow outbound connections to printer IPs on port 9100
- Block external access to port 9100 from internet

### Data Privacy
- Printer configuration stored locally in browser
- No data sent to external servers
- Bill history stored in IndexedDB (local only)

---

## Maintenance

### Regular Tasks
- **Weekly**: Test both printers, verify connections
- **Monthly**: Check for printer firmware updates
- **Quarterly**: Review and update static IP assignments if needed

### Updating Printer IPs
If you change printer IP addresses:
1. Update DHCP reservation on router
2. Open Configure Printers in billing system
3. Update IP addresses
4. Test connections
5. Save configuration

---

## FAQ

**Q: Can I use Bluetooth printers?**  
A: No, the system requires WiFi/network connected printers. Bluetooth is not supported.

**Q: Do I need special software on my tablet?**  
A: No, everything runs in the web browser. No apps or drivers needed.

**Q: Can I print from multiple tablets?**  
A: Yes, each tablet can be configured to print to the same printers. Each tablet stores its own configuration.

**Q: What if my printer doesn't support WiFi?**  
A: You can use a print server device that connects via USB to the printer and provides network access.

**Q: Can I use printers from different manufacturers?**  
A: Yes, as long as both support ESC/POS standard commands.

**Q: How do I reset the configuration?**  
A: Open browser settings → Clear browsing data → Select "Local Storage" → Clear. Then reconfigure printers.

---

## Support

### Printer Manuals
Refer to your thermal printer's documentation for:
- Network setup instructions
- Default IP and port settings
- ESC/POS command compatibility
- Troubleshooting hardware issues

### System Logs
To view system logs for debugging:
1. Press `F12` in browser to open Developer Tools
2. Go to **Console** tab
3. Look for printer-related messages
4. Messages show connection attempts, errors, and success confirmations

---

## Migration from Old System

If you're updating from the previous USB/Serial system:

### What Changed
- ❌ **Removed**: Web Serial API (USB) connection
- ❌ **Removed**: Browser print dialog
- ✅ **Added**: WiFi network printing
- ✅ **Added**: Dual printer support
- ✅ **Added**: Tablet optimization

### Migration Steps
1. Ensure printers are WiFi-enabled
2. Configure printer IPs (see Configuration section)
3. Test printing before going live
4. Old configurations will be ignored (new system uses different storage keys)

---

## Version Information

- **WiFi Printer Module**: `wifi-printer-comm.js`
- **Print Method**: WiFi/Network only
- **Supported Printers**: ESC/POS compliant
- **Max Printers**: 2 simultaneous

---

*Last Updated: 2024*  
*Best Fruits Stall Billing System*
