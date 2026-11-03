# Project instructions

## Purpose
Build a practical website to find and curate Vans product images by item code, then export an Excel workbook with one image per row.

## Current implementation
- Local Node.js server (`server.js`), vanilla HTML/CSS/JavaScript (`public/`).
- SheetJS for Excel import/export, installed via the official distribution.
- Brave image-search backend (`lib/search.js`, `/api/images`) and candidate review UI are implemented. API keys are server-side in `.env`.
- Provider behavior is tested with mocked responses; live search remains unverified without a key. CDN pattern lookup is a separate best-effort fallback.

## Required behavior
- Bulk item codes or Excel/CSV catalog input with column mapping.
- Skip blank codes, merge repeated product codes.
- Preserve user-entered handles. Code-derived handle is only a fallback.
- Remove images and reorder within the same product; first image is hero.
- Export exact columns: Handle, Item Code, Image Position, Image Src, Image Alt Text.
- Repeat handle and item code on every image row; contiguous positions begin at 1 per product.
- Alt text: `<item code>- hero view`, then `<item code>- Alt 1`, `<item code>- Alt 2`, etc.
- Export only retained images; no fabricated sources or generated product photos.

## Next milestone
First prove retrieval for 3–5 representative real product codes using an approved feed or documented search API. Keep API keys server-side in environment variables. Show source and failure status. Do not bypass blocked sites. Full web search must not be presented as working until verified.

## Development
Keep the existing stack unless a feature requires a change. Do not add a framework for cosmetic edits alone. Keep company catalogs, exports, credentials, and local workspaces out of Git. Run `npm run check` and `npm test` after relevant changes. State any limits on browser or network testing.
