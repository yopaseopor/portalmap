# CORS Proxy Setup for PortalMap

This document explains how to set up and use the CORS proxy server for the PortalMap application.

## Overview

The PortalMap application needs to make cross-origin requests to various external APIs. To avoid CORS (Cross-Origin Resource Sharing) restrictions in web browsers, a proxy server is set up to forward these requests.

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Make sure you have the required dependencies installed:
```bash
npm install
```

2. The proxy server is configured in `cors-proxy.js` and uses the following packages:
   - `express` - Web framework for Node.js
   - `cors` - CORS middleware
   - `http-proxy-middleware` - Proxy middleware

### Running the Proxy Server

#### Method 1: Using npm script (Recommended)
```bash
npm run proxy
```

#### Method 2: Direct execution
```bash
node cors-proxy.js
```

The server will start on port 3001 by default. You can change the port by setting the `PORT` environment variable:
```bash
PORT=8080 node cors-proxy.js
```

## Proxy Endpoints

### Nominatim API Proxy
- **Local endpoint**: `http://localhost:3001/nominatim`
- **Target**: `https://nominatim.openstreetmap.org`
- **Purpose**: Geocoding and reverse geocoding services

Example usage:
```javascript
fetch('http://localhost:3001/nominatim/search?q=Barcelona&format=json')
  .then(response => response.json())
  .then(data => console.log(data));
```

### EU-DEM Terrain Data Proxy
- **Local endpoint**: `http://localhost:3001/eu-dem`
- **Target**: `https://www.eea.europa.eu/data-and-maps/data/eu-dem`
- **Purpose**: 3D DEM (Digital Elevation Model) terrain data for Cesium 3D viewer

### General Proxy
- **Local endpoint**: `http://localhost:3001/proxy?url=<encoded-url>`
- **Purpose**: Proxy any URL by passing it as a query parameter

Example usage:
```javascript
const targetUrl = encodeURIComponent('https://api.example.com/data');
fetch(`http://localhost:3001/proxy?url=${targetUrl}`)
  .then(response => response.json())
  .then(data => console.log(data));
```

## Health Check

You can check if the proxy server is running by accessing:
```
http://localhost:3001/health
```

This should return:
```json
{"status":"CORS proxy server is running"}
```

## Integration with PortalMap

The proxy server is automatically integrated into the PortalMap application. The frontend code has been updated to use the proxy endpoints instead of making direct cross-origin requests.

### 3D DEM Integration

For the 3D terrain functionality, the application now uses:
- Proxy for EU-DEM data: `http://localhost:3001/eu-dem/eu-dem-v1-1/`
- This bypasses CORS restrictions when loading terrain data in Cesium

### Nominatim Integration

Geocoding requests use the proxy:
- Instead of: `https://nominatim.openstreetmap.org/...`
- Now uses: `http://localhost:3001/nominatim/...`

## Configuration

The proxy server includes:
- CORS headers for all responses
- Request forwarding with proper headers
- Error handling and logging
- Support for GET, POST, PUT, DELETE, and OPTIONS methods

## Troubleshooting

### Proxy Server Not Starting
- Check if port 3001 is available
- Ensure Node.js and npm are installed
- Check for any error messages in the console

### CORS Issues Persist
- Verify the proxy server is running
- Check that the frontend is using the correct proxy URLs
- Look for console errors related to network requests

### 3D Terrain Not Loading
- Ensure the proxy server is running on port 3001
- Check browser console for terrain loading errors
- Verify EU-DEM proxy endpoint is accessible

## Security Considerations

This proxy server is intended for development and testing purposes. For production use:

1. Implement proper authentication and authorization
2. Add rate limiting
3. Configure allowed origins
4. Consider using a more robust proxy solution like nginx or a cloud service
5. Add request validation and sanitization

## Files Modified

- `cors-proxy.js` - Main proxy server implementation
- `src/index.js` - Updated to use proxy URLs for 3D terrain
- `package.json` - Added proxy script and dependencies

## Stopping the Proxy Server

To stop the proxy server, press `Ctrl+C` in the terminal where it's running.
