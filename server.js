import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createImageSearch } from './lib/search.js';
import { createAuth } from './lib/auth.js';
try { process.loadEnvFile(); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);
const origin = new URL(process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).origin;
if (production && !origin.startsWith('https://')) throw Error('Production requires an HTTPS APP_ORIGIN.');
const auth = createAuth({username:process.env.TEAM_USERNAME, hash:process.env.TEAM_PASSWORD_HASH, secure:production});
const searchImages = createImageSearch({apiKey:process.env.BRAVE_SEARCH_API_KEY});
const files = {
  '/': ['public/index.html', 'text/html; charset=utf-8'],
  '/index.html': ['public/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['public/app.js', 'text/javascript; charset=utf-8'],
  '/xlsx.js': ['node_modules/xlsx/dist/xlsx.full.min.js', 'text/javascript; charset=utf-8'],
};
async function body(req) {
  let result = '', size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 4096) throw Error('Body too large'); result += chunk; }
  return JSON.parse(result);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  const json = (status, value) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(value)); };
  const redirect = target => { res.writeHead(303, {Location:target}); res.end(); };
  try {
    const path = new URL(req.url, origin).pathname;
    if (path === '/health' && req.method === 'GET') { json(200, {ok:true}); return; }
    // Compare the browser's Origin to the configured public origin; never trust forwarding headers.
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site') { json(403, {error:'Origin not allowed.'}); return; }
    if (req.method === 'POST' && req.headers.origin !== origin) { json(403, {error:'Origin required.'}); return; }
    if (path === '/api/login' && req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('application/json')) { json(415, {error:'Use application/json.'}); return; }
      let data;
      try { data = await body(req); } catch { json(400,{error:'Invalid login request.'}); return; }
      if (typeof data?.username !== 'string' || typeof data?.password !== 'string' || data.username.length > 128 || data.password.length > 512) { json(400,{error:'Invalid login request.'}); return; }
      const result = await auth.login(req, data.username, data.password);
      if (result.cookie) res.setHeader('Set-Cookie', result.cookie);
      json(result.status, result.error ? {error:result.error} : {ok:true}); return;
    }
    if (path === '/login' && ['GET','HEAD'].includes(req.method)) {
      if (auth.valid(req)) { redirect('/'); return; }
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end(req.method === 'HEAD' ? undefined : await readFile(new URL('public/login.html',import.meta.url))); return;
    }
    if (path === '/api/logout' && req.method === 'POST') { res.setHeader('Set-Cookie',auth.logout(req)); json(200,{ok:true}); return; }
    if (!auth.valid(req)) {
      if (path.startsWith('/api/')) json(401, {error:'Please sign in to continue.'});
      else redirect('/login');
      return;
    }
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); json(405,{error:'Method not allowed.'}); return; }
    if (path === '/api/config') { json(200,{imageSearchConfigured:Boolean(process.env.BRAVE_SEARCH_API_KEY)}); return; }
    if (path === '/api/images') {
      if (req.method !== 'GET') { json(405,{error:'Use GET for image search.'}); return; }
      try { json(200,await searchImages(new URL(req.url,origin).searchParams.get('code'))); }
      catch (error) { json(error.status || 500,{error:error.status ? error.message : 'Image search failed.'}); }
      return;
    }
    const entry = files[path];
    if (!entry) { json(404,{error:'Not found.'}); return; }
    const data = await readFile(new URL(entry[0],import.meta.url));
    res.setHeader('Content-Type',entry[1]); res.end(req.method === 'HEAD' ? undefined : data);
  } catch { if (!res.headersSent) json(500,{error:'The server could not complete this request.'}); else res.end(); }
});
server.requestTimeout = 20000;
server.listen(port, process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'), () => console.log(`Vans Image Workbench listening on port ${port}. Team login ${auth.configured ? 'configured' : 'NOT configured; workspace locked'}.`));
