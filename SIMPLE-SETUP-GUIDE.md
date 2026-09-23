# Simple Setup Guide for WiFi Thermal Printers
## For Non-Technical Users

---

## What You Need to Know (Simple Explanation)

### What is an IP Address?
Think of your WiFi network like a street, and every device (tablet, printer, phone) has a **house number**. This house number is called an **IP address**.

**Example IP Address:** `192.168.1.100`

When your printer connects to WiFi, it automatically gets a house number. Your tablet needs to know this number to send print jobs to the right printer.

### What is a Port Number?
If the IP address is a house number, the **port** is like a specific door or window at that house.

Most thermal printers use **door number 9100** (the standard door for receipt printers). This is already filled in for you - **you usually don't need to change it**.

**Default Port:** `9100` (Keep this unless your printer's manual says otherwise)

---

## Easy Setup (Recommended) - Auto-Discovery

### Step 1: Connect Printers to WiFi
1. Turn on your thermal printer
2. Press the **WiFi setup button** on your printer (check your printer's manual)
3. Connect it to your WiFi network using the printer's screen
4. The printer will show "Connected" or a WiFi symbol

### Step 2: Auto-Discover in the App
1. Open your billing system on your tablet
2. Click **⚙️ Configure Printers**
3. Click the big **🔍 Auto-Discover Printers** button
4. Wait 10-20 seconds while the system searches
5. The system will automatically fill in the IP addresses!
6. Give each printer a friendly name (like "Counter Printer" or "Kitchen Printer")
7. Click **Save Configuration**

### Step 3: Test It
1. Create a test bill
2. Click **Print Receipt**
3. Both printers should print!

---

## Manual Setup (If Auto-Discovery Doesn't Work)

### How to Find Your Printer's IP Address

#### Option 1: Print Configuration Page (Easiest)
1. Turn off your printer
2. Hold down the **FEED button** (the paper feed button)
3. Turn the printer back on while still holding FEED
4. The printer will print a page showing all its settings
5. Look for "IP Address" - it will look like: `192.168.1.100`

#### Option 2: Check Router (If you have access)
1. Open your router's admin page (usually at `192.168.1.1` or `192.168.0.1`)
2. Look for "Connected Devices" or "Device List"
3. Find your printer in the list
4. Note down its IP address

#### Option 3: Check Printer Screen
Some printers have a small screen that shows the IP address:
1. Press the **Menu** button on your printer
2. Navigate to **Network Settings** or **WiFi Info**
3. Look for the IP address displayed

### Entering IP Address Manually
1. Click **⚙️ Configure Printers**
2. Under "Printer 1 Network Address (IP)", type the IP you found
3. Leave Port as `9100`
4. Click **Test Printer 1 Connection**
5. If it says "Success", click **Save Configuration**
6. Repeat for Printer 2 if you have a second printer

---

## Common Questions

### Q: Why do I need the IP address?
**A:** Your tablet needs to know where to send the print job on your WiFi network. It's like knowing someone's phone number to call them.

### Q: Will the IP address change?
**A:** Sometimes yes, if your printer restarts. To prevent this:
- Keep your printer powered on all the time, OR
- Ask someone to set up a "static IP" in your router settings

### Q: What is Port 9100?
**A:** It's the standard "door" that receipt printers use to receive print jobs. Think of it as the printer's mailbox number. You almost never need to change this.

### Q: Why is the port editable?
**A:** Some older or specialty printers might use a different port number (like 8008 or 9101). If your printer's manual mentions a different port number, you can change it here.

### Q: Do I need two printers?
**A:** No! You can use just one printer. Leave Printer 2 empty if you only have one.

### Q: Can I use any WiFi printer?
**A:** You need a **thermal receipt printer** that supports WiFi. Regular office printers won't work. Look for printers labeled:
- "ESC/POS compatible"
- "Thermal receipt printer"
- "WiFi thermal printer"

---

## Troubleshooting

### Problem: Auto-Discovery Found No Printers

**Possible Causes:**
1. **Printer not connected to WiFi** - Check the printer's WiFi status light
2. **Different WiFi network** - Make sure your tablet and printers are on the SAME WiFi
3. **Printer is off** - Turn on both printers
4. **Firewall blocking** - Some routers block device discovery

**Solution:**
- Use manual setup instead (see "Manual Setup" above)
- Check that printer shows "WiFi Connected"
- Restart your printer and try again

### Problem: "Connection Failed" When Testing

**Possible Causes:**
1. **Wrong IP address** - The IP might have changed
2. **Printer is off or sleeping**
3. **Not on same network** - Tablet and printer must be on same WiFi

**Solution:**
- Print a configuration page from the printer to verify IP
- Make sure printer is powered on and awake
- Check WiFi connection on both tablet and printer

### Problem: Only One Printer Works

**Check:**
- Is the second printer turned on?
- Does the second printer have a different IP address? (Each printer needs its own unique IP)
- Try testing the second printer individually

---

## Network Setup Tips

### Best Practices
1. **Keep Printers On:** Leave printers powered on to keep their IP addresses
2. **Same Network:** All devices (tablet + printers) must be on the same WiFi
3. **Strong Signal:** Place printers close to your WiFi router for best performance
4. **Label Printers:** Put a sticker on each printer showing its IP address for future reference

### What Your IT Person Should Do (If You Have One)
Ask them to set up "DHCP Reservations" or "Static IPs" for your printers:
- Printer 1: Always use `192.168.1.100`
- Printer 2: Always use `192.168.1.101`

This prevents the IP addresses from changing.

---

## Quick Reference Card

Print this and keep it near your tablet:

```
┌────────────────────────────────────────────┐
│  PRINTER QUICK REFERENCE                   │
├────────────────────────────────────────────┤
│                                            │
│  Printer 1: _________________________     │
│  IP Address: ___.___.___.___ Port: 9100   │
│                                            │
│  Printer 2: _________________________     │
│  IP Address: ___.___.___.___ Port: 9100   │
│                                            │
│  WiFi Network: _______________________    │
│                                            │
│  Router Address: ___.___.___.___ │
│  (Usually 192.168.1.1)                    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Getting Help

### If Auto-Discovery Fails
1. Try manual setup
2. Print configuration page from printer to get IP
3. Make sure tablet and printers are on same WiFi

### If Manual Setup Fails
1. Check printer is connected to WiFi (look for WiFi symbol on printer)
2. Verify IP address by printing configuration page
3. Try turning printer off and on
4. Check that port is set to 9100

### If Printing Fails
1. Check both printers show green dots in the status area
2. Click "Configure Printers" and test each printer
3. Make sure printers have paper and are not showing error lights

---

## Visual Guide to Finding Printer Info

### Printer Configuration Page Example
When you print a configuration page, look for these sections:

```
========================================
    NETWORK CONFIGURATION
========================================
Status: Connected
SSID: YourWiFiName
IP Address: 192.168.1.100  ← THIS IS WHAT YOU NEED
Subnet Mask: 255.255.255.0
Gateway: 192.168.1.1
Port: 9100  ← AND THIS
========================================
```

Copy the **IP Address** and **Port** into the configuration screen.

---

*Remember: Most of the time, you just need to click "Auto-Discover Printers" and it will work automatically!*
