const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Proxy middleware for Nominatim API
app.use('/nominatim', createProxyMiddleware({
  target: 'https://nominatim.openstreetmap.org',
  changeOrigin: true,
  pathRewrite: {
    '^/nominatim': '', // remove /nominatim from the path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add CORS headers
    proxyReq.setHeader('Access-Control-Allow-Origin', '*');
    proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Proxy middleware for EU-DEM terrain data
app.use('/eu-dem', createProxyMiddleware({
  target: 'https://www.eea.europa.eu/data-and-maps/data/eu-dem',
  changeOrigin: true,
  pathRewrite: {
    '^/eu-dem': '', // remove /eu-dem from the path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add CORS headers
    proxyReq.setHeader('Access-Control-Allow-Origin', '*');
    proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// General proxy for any URL passed as query parameter
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const fetch = require('node-fetch');
    const response = await fetch(targetUrl);
    const data = await response.text();

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Forward the response
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'CORS proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`CORS proxy server running on port ${PORT}`);
  console.log(`Nominatim proxy: http://localhost:${PORT}/nominatim`);
  console.log(`General proxy: http://localhost:${PORT}/proxy?url=<encoded-url>`);
});
