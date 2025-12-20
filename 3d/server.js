const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Parse the requested URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Remove query string if present
    if (pathname.includes('?')) {
        pathname = pathname.split('?')[0];
    }

    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(BASE_DIR, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Set appropriate headers for JavaScript modules
            if (ext === '.js') {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': content.length
                });
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': content.length
                });
            }
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${BASE_DIR}`);
    console.log('Press Ctrl+C to stop the server');
});

console.log(`Starting server on port ${PORT}...`);
