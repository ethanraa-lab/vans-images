import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const hash = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export function createAuth({ username = '', hash = '', secure = false, now = Date.now } = {}) {
  const configured = Boolean(username && /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash));
  const sessions = new Map(), attempts = new Map();
  const ttl = 8 * 60 * 60 * 1000;
  const digest = value => createHash('sha256').update(String(value)).digest();
  const cookieName = secure ? '__Host-vans_session' : 'vans_session';
  function token(req) {
    const match = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='));
    return match?.slice(cookieName.length + 1);
  }
  function prune() {
    for (const [key, until] of sessions) if (until <= now()) sessions.delete(key);
    for (const [key, value] of attempts) if (value.until <= now()) attempts.delete(key);
  }
  function valid(req) { prune(); return configured && sessions.has(token(req)); }
  function cookie(value, age) { return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`; }
  return {
    configured, valid,
    async login(req, name, password) {
      if (!configured) return { status: 503, error: 'Team login needs configuration by the site owner.' };
      prune();
      const ip = req.socket.remoteAddress || 'unknown';
      const bucket = attempts.get(ip) || { count: 0, until: now() + 900000 };
      const global = attempts.get('*') || { count: 0, until: now() + 900000 };
      if (bucket.count >= 10 || global.count >= 100) return { status: 429, error: 'Too many login attempts. Try again in 15 minutes.' };
      bucket.count++; global.count++; attempts.set(ip, bucket); attempts.set('*', global);
      // Always derive the password, including when the username is wrong.
      const [, salt, expected] = hash.split(':');
      const result = await passwordHash(password, salt);
      const correctPassword = timingSafeEqual(Buffer.from(result.split(':')[2], 'hex'), Buffer.from(expected, 'hex'));
      const correctName = timingSafeEqual(digest(name), digest(username));
      if (!correctPassword || !correctName) return { status: 401, error: 'Incorrect username or password.' };
      if (token(req)) sessions.delete(token(req));
      if (sessions.size >= 500) sessions.delete(sessions.keys().next().value);
      const session = randomBytes(32).toString('hex'); sessions.set(session, now() + ttl);
      return { status: 200, cookie: cookie(session, ttl / 1000) };
    },
    logout(req) { sessions.delete(token(req)); return cookie('', 0); },
  };
}
