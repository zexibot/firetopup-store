// Local Development Server (Simulates Vercel Serverless Functions + Static Hosting)
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // 1. API Routes (Same as Vercel)
  if (pathname === '/api/create-order') {
    const handler = require('./api/create-order.js');
    return handleServerless(req, res, handler, parsedUrl);
  }
  if (pathname === '/api/check-status') {
    const handler = require('./api/check-status.js');
    return handleServerless(req, res, handler, parsedUrl);
  }
  if (pathname === '/api/verify' || pathname === '/api/verify.php') {
    const handler = require('./api/verify.js');
    return handleServerless(req, res, handler, parsedUrl);
  }

  // 2. Static Files
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(__dirname, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

async function handleServerless(req, res, handler, parsedUrl) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let parsedBody = {};
    try { parsedBody = JSON.parse(body); } catch (_) { parsedBody = body; }

    const fakeReq = {
      method: req.method,
      headers: req.headers,
      body: parsedBody,
      query: Object.fromEntries(parsedUrl.searchParams.entries())
    };

    const fakeRes = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(data) {
        this.setHeader('Content-Type', 'application/json');
        res.writeHead(this.statusCode, this.headers);
        res.end(JSON.stringify(data));
      },
      end(data) {
        res.writeHead(this.statusCode, this.headers);
        res.end(data);
      }
    };

    try {
      await handler(fakeReq, fakeRes);
    } catch (err) {
      console.error('API Error:', err);
      fakeRes.status(500).json({ error: err.message });
    }
  });
}

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Local Full-Stack Server running at http://localhost:${PORT}`);
});
