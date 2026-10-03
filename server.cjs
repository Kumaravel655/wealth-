// Production server for Node.js hosting (Hostinger / cPanel "Setup Node.js App", any VPS).
// Serves the static Vite build in dist/. No dependencies, so `npm install --omit=dev` is enough to run it.
// CommonJS on purpose: LiteSpeed's Node runner loads the startup file with require().
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const CANONICAL_HOST = 'thewealthbridge.in';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.txt', '.xml', '.svg']);

// Same headers and cache rules as public/.htaccess, so Apache and Node hosting behave alike.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};
function cacheControl(urlPath, ext) {
  if (urlPath.startsWith('/assets/build/')) return 'public, max-age=31536000, immutable'; // hashed by Vite
  if (ext === '.html') return 'no-cache';
  if (ext === '.woff2' || ext === '.woff') return 'public, max-age=31536000';
  if (ext === '.css' || ext === '.js' || ext === '.json') return 'public, max-age=2592000';
  return 'public, max-age=15552000';
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function send(req, res, status, filePath, urlPath) {
  const ext = path.extname(filePath).toLowerCase();
  const headers = {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cacheControl(urlPath, ext),
  };
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  if (gzip) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = fs.statSync(filePath).size;
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => res.destroy());
  (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
}

function notFound(req, res) {
  const page = path.join(ROOT, '404.html');
  if (isFile(page)) return send(req, res, 404, page, '/404.html');
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  // www → bare domain (HTTPS itself is handled by the host's proxy / SSL settings).
  const host = (req.headers.host || '').toLowerCase();
  if (host.startsWith('www.')) {
    res.writeHead(301, { Location: `https://${CANONICAL_HOST}${req.url}` });
    return res.end();
  }

  let url, urlPath;
  try {
    url = new URL(req.url, 'http://x');
    urlPath = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }

  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return notFound(req, res);

  if (isDir(filePath)) {
    // /about → /about/ so the page's relative URLs resolve, as Apache does.
    if (!urlPath.endsWith('/')) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    const index = path.join(filePath, 'index.html');
    return isFile(index) ? send(req, res, 200, index, urlPath + 'index.html') : notFound(req, res);
  }
  if (isFile(filePath)) return send(req, res, 200, filePath, urlPath);
  return notFound(req, res);
});

if (!isFile(path.join(ROOT, 'index.html'))) {
  console.error('dist/index.html is missing. Run "npm run build" before starting the server.');
}

server.listen(PORT, () => console.log(`Wealth Bridge site on port ${PORT}`));
