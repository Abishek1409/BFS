# Windows Print Server Auto-Start

The Vercel website cannot open a raw TCP connection to a printer on your private WiFi. This local bridge runs on the laptop, receives the browser's requests, and sends them to the printers. For separate customer and kitchen formats, use `print-server.js`; `simple-print-server.js` supports only one printer.

## One-Time Windows Setup

1. Find each printer's WiFi IP address from its network/status printout.
2. Double-click `setup-windows.bat` in this project folder.
3. Enter Printer 1's IP and, if used, Printer 2's IP. The script saves the addresses in your Windows user environment, installs dependencies, and registers `print-server.js` with PM2 for startup.
4. Sign out and back in or restart Windows so the saved environment variables are loaded by startup programs.
5. In the billing app, configure each WiFi printer slot to `localhost`, port `3000` when the website is open on this same laptop.

The existing `start-print-server.bat` is the non-PM2 alternative. Add a shortcut to it in the folder opened by `Win + R` then `shell:startup`. That method starts after sign-in and displays a console window.

## Verify

- Open `http://localhost:3000/` to confirm the bridge is running and see its configured printer addresses.
- Open `http://localhost:3000/test/printer1` and, if configured, `http://localhost:3000/test/printer2` to test network reachability.
- Print from Vercel in a browser on the laptop. Click Print once; each configured printer receives its own format.

The Vercel page and local bridge must be used from the same laptop for `localhost` to work. On a different device, configure the laptop's LAN IP instead, and allow the server through the laptop firewall on the private network.

## PM2 Commands

```cmd
pm2 status
pm2 logs possiflow-printer
pm2 restart possiflow-printer
pm2 stop possiflow-printer
pm2 delete possiflow-printer
pm2 save
```

If a printer IP changes, run `setx PRINTER1_IP "new-ip"` or `setx PRINTER2_IP "new-ip"`, then sign out and back in before restarting PM2. For one printer only, configure Printer 1 and leave Printer 2 unconfigured in the app.

## Troubleshooting

- If the bridge does not start, check `node --version`, run `npm install` in the project folder, and inspect `pm2 logs possiflow-printer`.
- If `/test/printer1` fails, verify the saved IP, printer power, WiFi connection, and port 9100 reachability.
- If the browser cannot reach `localhost:3000`, confirm the bridge is running on the same laptop and that Windows Firewall permits it on the private network.
- If port 3000 is occupied, set `PORT` for the server and configure the app to use that matching port.

**No daily commands. No manual start. Just works!** 🚀
