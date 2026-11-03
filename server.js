import http from 'node:http';
import { createImageSearch } from './lib/search.js';
try { process.loadEnvFile(); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const searchImages = createImageSearch({apiKey:process.env.BRAVE_SEARCH_API_KEY});
import { readFile } from 'node:fs/promises';
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
  if (!['localhost', '127.0.0.1'].includes((req.headers.host || '').split(':')[0])) { res.writeHead(403); res.end('Host not allowed'); return; }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/api/config' || path === '/api/images') {
    const host = req.headers.host;
    const origin = req.headers.origin;
    if (origin && origin !== `http://${host}`) { res.writeHead(403); res.end('Origin not allowed'); return; }
    if (req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(403); res.end('Origin not allowed'); return; }
    const json = (status, value) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(value)); };
    if (path === '/api/config') { json(200, {imageSearchConfigured: Boolean(process.env.BRAVE_SEARCH_API_KEY)}); return; }
    if (req.method !== 'GET') { json(405, {error:'Use GET for image search.'}); return; }
    try { json(200, await searchImages(new URL(req.url, 'http://localhost').searchParams.get('code'))); }
    catch (error) { json(error.status || 500, {error: error.status ? error.message : 'Image search failed.'}); }
    return;
  }
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
