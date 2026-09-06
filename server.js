/**
 * KoneKA — Wireframe Desktop
 * Server statis sederhana pakai Node.js core (tanpa dependency npm).
 * Jalankan: node server.js  (atau: npm start)
 * Lalu buka: http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Handle Netlify Function endpoints for local testing (e.g. netlify/functions/send-email.js, netlify/functions/verify-turnstile.js)
  if (urlPath.startsWith('/.netlify/functions/') || urlPath.startsWith('/api/')) {
    const fnName = urlPath.replace('/.netlify/functions/', '').replace('/api/', '');
    const fnPath = path.join(ROOT, 'netlify', 'functions', fnName + '.js');
    if (fs.existsSync(fnPath)) {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            delete require.cache[require.resolve(fnPath)];
            const fn = require(fnPath);
            const result = await fn.handler({
              httpMethod: 'POST',
              body: body,
              headers: req.headers
            }, {});
            res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
            res.end(result.body || '');
          } catch(e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
    }
  }

  const filePath = path.join(ROOT, urlPath);

  // Cegah path traversal keluar dari folder proyek
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Halaman tidak ditemukan');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if (ext === '.html' || path.basename(filePath) === 'sw.js') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ KoneKA (Wireframe Desktop) jalan di:  http://localhost:${PORT}\n`);
  console.log('Tekan Ctrl+C untuk menghentikan server.\n');
});
