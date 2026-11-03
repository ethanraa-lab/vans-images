import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const port = Number(process.env.PORT || 3000);
const files = {
  '/': ['public/index.html', 'text/html; charset=utf-8'],
  '/index.html': ['public/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['public/app.js', 'text/javascript; charset=utf-8'],
  '/xlsx.js': ['node_modules/xlsx/dist/xlsx.full.min.js', 'text/javascript; charset=utf-8'],
};
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('Method not allowed'); return;
  }
  const path = new URL(req.url, 'http://localhost').pathname;
  const entry = files[path];
  if (!entry) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const data = await readFile(new URL(entry[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': entry[1], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Required file missing. Run npm install, then restart the server.');
  }
});
// Local development only. A production deployment needs its own access controls.
server.listen(port, '127.0.0.1', () => console.log(`Vans Image Workbench: http://localhost:${port}`));
