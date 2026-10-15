# Auto-Start the Print Server on Login

The print server (`print-server.js`) is now set to start automatically every time
you log into Windows. Here's what was set up and the one thing you still need to do.

## What was set up for you

1. **`start-print-server-hidden.vbs`** — launches the server silently in the
   background (no black console window pops up on boot).
2. **Startup shortcut** — a shortcut named `Print Server` was placed in your
   Windows Startup folder:
   `C:\Users\Safeeq\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Print Server.lnk`
   Windows runs everything in this folder automatically when you log in.

## The one thing you must do: install Node.js

The server runs on Node.js, which is **not currently installed** on this laptop.
Until you install it, auto-start will not work.

1. Download the Windows installer (LTS) from https://nodejs.org
2. Run the installer. Keep the default options (this adds Node to your PATH).
3. Restart the laptop, or log out and back in.

## Install the server's dependencies (one time)

After Node.js is installed, open PowerShell in the project folder and run:

```powershell
npm install express cors
```

(If a `node_modules` folder with `express` and `cors` already exists, you can skip this.)

## Test it

- Log out and back in (or restart). The server starts silently in the background.
- Open a browser and go to: http://localhost:3000
  - You should get a response from the print server.
- To confirm the process is running, open Task Manager and look for `node.exe`.

## Turn auto-start off later

Delete the `Print Server` shortcut from the Startup folder:

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Delete `Print Server.lnk`.

## Notes

- The server runs from this folder, so don't move or rename the `BFS-main` folder
  without updating the shortcut/VBS paths.
- To start it manually right now without rebooting, double-click
  `start-print-server.bat` (it shows a window and any errors), or double-click
  `start-print-server-hidden.vbs` (runs silently).
