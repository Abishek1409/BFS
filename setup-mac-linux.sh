#!/bin/bash

echo "========================================"
echo "Possiflow Print Server - Mac/Linux Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install from: https://nodejs.org"
    exit 1
fi

echo "[1/4] Installing PM2..."
npm install -g pm2

echo ""
echo "[2/4] Starting print server..."
pm2 start simple-print-server.js --name possiflow-printer

echo ""
echo "[3/4] Saving configuration..."
pm2 save

echo ""
echo "[4/4] Configuring auto-start..."
echo "Running: pm2 startup"
echo ""
pm2 startup

echo ""
echo "========================================"
echo "IMPORTANT: Copy and run the command above!"
echo "========================================"
echo ""
echo "After running the pm2 startup command:"
echo "  pm2 save"
echo ""
echo "Then test: http://localhost:3000/test"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check if running"
echo "  pm2 logs possiflow-printer - View logs"
echo "  pm2 restart possiflow-printer - Restart server"
echo ""
