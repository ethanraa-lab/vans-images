export class SearchError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function normalizeCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) throw new SearchError(400, 'Use an item code with 3–40 letters, numbers, hyphens or underscores.');
  return code;
}
function publicHttps(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    if (u.hostname === 'localhost' || u.hostname.endsWith('.localhost') || u.hostname.endsWith('.local') || u.hostname.includes(':') || /^\d+(\.\d+){3}$/.test(u.hostname)) return null;
    return u.href;
  } catch { return null; }
}
export function parseResults(data, code) {
  if (!Array.isArray(data.results)) throw new SearchError(502, 'Image search returned an unexpected response.');
  const seen = new Set();
  const needle = code.replace(/[^A-Z0-9]/g, '');
  return data.results.flatMap(r => {
    const image = publicHttps(r.properties?.url);
    if (!image || seen.has(image)) return [];
    seen.add(image);
    const page = publicHttps(r.url);
    const evidence = [r.title, r.url, r.properties?.url].join(' ').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return [{ url: image, page, title: String(r.title || '').slice(0, 250), host: new URL(image).hostname,
      codeMentioned: evidence.includes(needle), width: Number(r.properties?.width) || null, height: Number(r.properties?.height) || null }];
  }).sort((a, b) => Number(b.codeMentioned) - Number(a.codeMentioned));
}
export function createImageSearch({ apiKey = '', fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map();
  let inFlight = false, lastRequest = -Infinity;
  return async value => {
    const code = normalizeCode(value);
    if (!apiKey) throw new SearchError(503, 'Image search is not configured. Add BRAVE_SEARCH_API_KEY to .env and restart the server. You can still import or paste image URLs.');
    const cached = cache.get(code);
    if (cached && now() - cached.at < 300000) return { ...cached.value, cached: true };
    if (inFlight || now() - lastRequest < 1100) throw new SearchError(429, 'Please wait a moment before starting another image search.');
    inFlight = true; lastRequest = now();
    try {
      const url = new URL('https://api.search.brave.com/res/v1/images/search');
      url.search = new URLSearchParams({ q: `Vans "${code}"`, count: '30', safesearch: 'strict', spellcheck: 'false', search_lang: 'en', country: 'ALL' });
      const response = await fetchImpl(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        if ([401,403].includes(response.status)) throw new SearchError(502, 'The search provider rejected the API key or its access. Check your Brave account configuration.');
        if (response.status === 429) throw new SearchError(429, 'The image-search rate limit or quota was reached. Try later or check your Brave account.');
        throw new SearchError(502, 'The image-search provider is currently unavailable.');
      }
      const results = parseResults(await response.json(), code);
      const result = { code, provider: 'Brave', results, cached: false };
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(code, { at: now(), value: result });
      return result;
    } catch (error) {
      if (error instanceof SearchError) throw error;
      throw new SearchError(502, 'Image search timed out or failed. Please try again later.');
    } finally { inFlight = false; }
  };
}
