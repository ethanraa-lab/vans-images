# Vans Image Workbench

A local website for collecting Vans product images, choosing a hero view, arranging alternative views, and exporting one Excel row per image.

## Run on your computer

Install Node.js 22 or later and Git, then open a terminal:

```bash
git clone https://github.com/ethanraa-lab/vans-images.git
cd vans-images
npm install
npm start
```

Configure the shared account below before opening **http://localhost:3000**. For development, use `npm run dev`.
The private repository requires GitHub access through your normal Git authentication. Never paste tokens into project files.

## Develop through GitHub

Use GitHub Codespaces or your preferred Git workflow. Project requirements are in `AGENTS.md`. Run `npm run check` and `npm test` before committing changes. Codespaces port forwarding requires APP_ORIGIN to match its exact forwarded HTTPS URL.

## Shared team login

There is one shared account and no public registration. The server fails closed: until both login settings are supplied, the workspace and search API remain inaccessible. No default credentials are shipped.

1. Copy `.env.example` to `.env` (or configure the variables in your hosting service).
2. Set `TEAM_USERNAME` to the shared username.
3. Run `npm run hash-password` in a trusted terminal. Enter a password of at least 12 characters at the hidden prompt. Copy the resulting salted hash into `TEAM_PASSWORD_HASH`.
4. Set `APP_ORIGIN` to the exact browser URL (local default: `http://localhost:3000`). Restart the server.
5. Sign in at `/login`; use **Log out** when finished.

Never commit the plaintext password, password hash, API key or `.env`. Share the password privately with your team. Do not put passwords in shell commands or chat.

Passwords are verified with salted scrypt hashes. Opaque sessions use HttpOnly, SameSite=Strict cookies and expire after eight hours; production cookies also require HTTPS (Secure). Login attempts are rate limited. Logout revokes the current session on the server. Restarting the server or changing credentials revokes all sessions. Sessions and rate limits are in memory: deploy one instance for this initial version.

Workspaces remain browser-local, including after logout. The shared account does not sync catalogs or image selections between colleagues, and it cannot identify who performed an action. JSON backups let you transfer work deliberately.

## Deploy for team access

The code is prepared for a Node.js 22+ hosting service; it has **not been deployed** from this repository. GitHub Pages cannot run this server. Keep the repository private while publishing the login-protected application.

- Install: `npm ci`; start: `npm start`.
- Set `NODE_ENV=production`, `HOST=0.0.0.0` and `APP_ORIGIN=https://your-actual-hostname`.
- Set `TEAM_USERNAME`, `TEAM_PASSWORD_HASH` and `BRAVE_SEARCH_API_KEY` as hosting secrets.
- Let the host supply `PORT`. Enable HTTPS at the hosting edge. No forwarded headers are trusted for origin validation.
- Health-check path: `/health` (only returns a basic status).

Without a configured shared account, deployment remains locked. Without a Brave key, login, URL import, image ordering and Excel export still work, while automatic search reports setup is needed.

## Current features

- Paste item codes separated by newlines, commas, semicolons or tabs.
- Import Excel or CSV catalogs with worksheet and column mapping.
- Skip blank item codes and merge repeated codes.
- Import image URLs from a mapped column, or paste multiple URLs for a product.
- Validate that image URLs load; skip exact duplicate URLs.
- Drag images within a product, use arrow buttons, or choose Hero.
- Remove unwanted images. Positions and alt text update after reordering.
- Edit each product handle; an item-code slug is the initial fallback.
- Export `.xlsx` and preview its vertical rows.
- Browser-local workspace persistence, with JSON backup and restore.

## Configure automatic image search

The server integrates the [Brave Image Search API](https://api-dashboard.search.brave.com/api-reference/images/image_search). You need your own key with image-search access. Check your provider plan and usage limits before using it.

1. Copy `.env.example` to `.env` in this project folder.
2. Set `BRAVE_SEARCH_API_KEY` in `.env` locally. Do not paste the key in chat or commit it.
3. Restart `npm start`. The page will show that search is configured.
4. Paste item codes or import a catalog. Search candidates appear below each product.
5. Inspect each image and its source page; choose **Keep** for the correct views. Dismiss unwanted candidates.
6. Reorder retained images and export.

Only original image URLs are retained/exported; search thumbnails are not substituted. Code mentions are textual evidence only, not a guarantee that a product or colour is correct. Images must load successfully before they can be kept. Some sources may block direct image loading.

API requests use a quoted item code, disabled spellchecking, and 30 candidates. Exact URLs are deduplicated. Searches use a bounded five-minute memory cache and a one-request-at-a-time throttle. Quota, invalid-key, missing-key and network failures have separate messages. A catalog containing image URLs imports those URLs without searching that product.

**Verification status:** provider requests, result parsing, caching, failure handling and export behavior are covered by automated tests using mocked provider responses. Live Brave retrieval has not been verified because no API key is configured in the development environment. Validate 3–5 real product codes before relying on batch search.

Without a key you can still import/paste image URLs, arrange images and export. The separate **Try Vans CDN pattern** button is best-effort; earlier tests returned no usable images. Manual Google Images opens a search page and does not collect its results. PDF catalogs and embedded Excel pictures are not extracted.

## Excel output

| Handle | Item Code | Image Position | Image Src | Image Alt Text |
| --- | --- | --- | --- | --- |
| old-skool | VN000D3HY28 | 1 | https://example.com/hero.jpg | VN000D3HY28- hero view |
| old-skool | VN000D3HY28 | 2 | https://example.com/side.jpg | VN000D3HY28- Alt 1 |
| old-skool | VN000D3HY28 | 3 | https://example.com/back.jpg | VN000D3HY28- Alt 2 |

Example URLs above are illustrative. Every retained image becomes a row, with the same product handle and item code repeated. This is the requested workbook schema, not a complete Shopify product-import template.

## Data and dependencies

Catalogs are parsed in the browser. When searching, each item code is sent to the local server and Brave. Candidates stay in memory until refresh; retained images are saved in the browser workspace. The workspace is stored in this browser on this origin. External image hosts receive requests when images are checked/displayed; manual Google searches contain the item code. Exported URLs remain dependent on their hosts.

SheetJS Community Edition 0.20.3 is installed from its official distribution URL and served locally as `/xlsx.js`. No runtime CDN script is required. This is an independent operations tool, not an official Vans application.

## Checks

```bash
npm run check
npm test
```

Tests cover product-code deduplication, vertical export fields, hero reordering and position renumbering. API request/parsing/cache/error behavior is tested with mocked responses. Live image discovery requires separate verification with your configured key.
