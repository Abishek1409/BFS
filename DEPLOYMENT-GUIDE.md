# Live 3D Café Map - Deployment Guide

This guide covers deploying the BFS billing system with the integrated Live 3D Café Map feature.

## Prerequisites

- Node.js 18+ 
- Modern browser with WebGL support
- Vercel account (recommended) or any static hosting service
- Firebase project with Realtime Database

## Quick Deployment (Vercel - Recommended)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy to Vercel
```bash
# From project root
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: bfs-cafe-system (or your choice)
# - Directory: . (current directory)
# - Override settings: No
```

### 3. Configure Environment Variables (if needed)
```bash
vercel env add PRINTER1_IP
vercel env add PRINTER2_IP
```

### 4. Redeploy with Environment Variables
```bash
vercel --prod
```

## Manual Deployment (Any Static Host)

### 1. Build Preparation
The project is ready for deployment as-is. No build step required.

### 2. Upload Files
Upload all files to your hosting service, maintaining directory structure:
- Root files: `index.html`, `order.html`, etc.
- `/map3d/` directory with all subdirectories
- All JavaScript and CSS files

### 3. Configure HTTPS
For best security and PWA features, enable HTTPS on your domain.

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Print Server (Optional)
```bash
npm start
```
The print server runs on http://localhost:3000

### 3. Serve Static Files
Use any static server for development:
```bash
# Using Python
python -m http.server 8080

# Using Node.js serve
npx serve .

# Using VS Code Live Server extension
```

## Configuration

### Firebase Configuration
Update `firebase-config.js` with your Firebase project settings:
```javascript
window.firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebasedatabase.app",
  projectId: "your-project-id",
  // ... other config
};
```

### Printer Configuration
The system supports multiple printer types:

#### WiFi Printers
- Configure printer IPs in the UI
- Uses port 9100 (standard ESC/POS)
- Supports auto-discovery on local network

#### USB Printers (Chrome/Edge only)
- Uses Web Serial API
- Requires user permission
- Auto-detects baud rate

#### Print Server (CORS Bypass)
- Run `npm start` to start local print server
- Configure app to use `http://localhost:3000`
- Bypasses CORS restrictions

## 3D Map Features

### System Requirements
- **Minimum**: WebGL 1.0 support, 2GB RAM
- **Recommended**: WebGL 2.0, 4GB+ RAM, dedicated GPU
- **Fallback**: Enhanced list view for unsupported devices

### Performance Optimization
- Automatic pixel ratio limiting
- Geometry instancing for repeated objects
- Tab visibility detection (pauses animations)
- Memory usage monitoring

### Browser Support
- **Full Support**: Chrome 80+, Firefox 75+, Safari 14+, Edge 80+
- **Partial Support**: Older browsers (fallback to list view)
- **Mobile**: iOS Safari 14+, Android Chrome 80+

## Troubleshooting

### 3D Map Not Loading
1. Check WebGL support: Visit https://webglreport.com
2. Disable browser extensions temporarily
3. Clear browser cache and reload
4. Check browser console for errors

### Printer Connection Issues
1. Verify printer IP and network connectivity
2. Check firewall settings (allow port 9100)
3. For USB printers, ensure Chrome/Edge browser
4. Try the local print server for CORS issues

### Firebase Connection Issues
1. Verify Firebase configuration
2. Check Firebase project permissions
3. Ensure Realtime Database rules allow read access
4. Test connection in browser dev tools

### Performance Issues
1. Disable 3D background if experiencing lag
2. Close other browser tabs
3. Check available system memory
4. Lower display resolution if needed

## Monitoring and Maintenance

### Performance Monitoring
The system includes built-in performance monitoring:
- Frame rate tracking (target: 30+ FPS)
- Memory usage monitoring (target: <50MB)
- Automatic quality adjustment

### Regular Maintenance
1. Monitor Firebase usage and billing
2. Update printer IPs if network changes
3. Clear browser cache periodically
4. Update dependencies monthly

### Backup and Recovery
- Firebase data is automatically backed up
- Local printer configurations stored in browser
- Export/import functionality for settings

## Security Considerations

### Network Security
- Use HTTPS in production
- Configure Firebase security rules properly
- Restrict printer network access to local subnet

### Data Privacy
- No sensitive data stored in browser
- Firebase rules should limit access appropriately
- Printer data is not logged or transmitted

## Scaling and Performance

### High-Traffic Optimization
1. Enable Firebase caching
2. Use CDN for static assets
3. Configure proper cache headers
4. Monitor Firebase concurrent connections

### Multi-Location Setup
1. Deploy separate instances per location
2. Use location-specific Firebase projects  
3. Configure printer settings per location
4. Implement location selection UI if needed

## Support and Updates

### Getting Help
1. Check browser console for error messages
2. Test individual components (billing, 3D map, printers)
3. Verify network connectivity and permissions
4. Check Firebase project status

### Future Updates
- Regular dependency updates
- New printer driver support
- Enhanced 3D features
- Performance improvements

## Version Information

- **System Version**: 1.0.0
- **3D Map Version**: 1.0.0
- **Supported Node.js**: 18+
- **Last Updated**: October 2026

For technical support or feature requests, refer to the project documentation or contact the development team.