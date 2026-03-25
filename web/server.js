import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

function getMime(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const types = {
    'html': 'text/html; charset=utf-8',
    'js':   'application/javascript; charset=utf-8',
    'mjs':  'application/javascript; charset=utf-8',
    'css':  'text/css; charset=utf-8',
    'svg':  'image/svg+xml',
    'png':  'image/png',
    'jpg':  'image/jpeg',
    'jpeg': 'image/jpeg',
    'ico':  'image/x-icon',
    'json': 'application/json',
    'woff': 'font/woff',
    'woff2':'font/woff2',
    'ttf':  'font/ttf',
    'map':  'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // HTTP → HTTPS redirect via Hostinger proxy header
  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto !== 'https') {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];
  let filePath  = path.join(DIST, urlPath);

  // SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const mime    = getMime(filePath);
  const content = fs.readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': mime,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`KeaFlow Web rodando na porta ${PORT}`);
});
