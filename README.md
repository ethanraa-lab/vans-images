# Vans Image Workbench

A local website for collecting Vans product images, choosing a hero view, arranging alternative views, and exporting one Excel row per image.

## Run on your computer

Install Node.js 20 or later and Git, then open a terminal:

```bash
git clone https://github.com/ethanraa-lab/vans-images.git
cd vans-images
npm install
npm start
```

Open **http://localhost:3000**. For development, use `npm run dev`.
The private repository requires GitHub access through your normal Git authentication. Never paste tokens into project files.

## Use with OpenCode

Open this cloned `vans-images` folder in OpenCode. It can read `AGENTS.md` for project requirements. Make changes here, run `npm run check` and `npm test`, then commit and push to this same repository.

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

## Important limitation: image discovery

**Reliable automatic web image search is not implemented.** The initial lookup only tries the standard Vans CDN HERO and ALT1–ALT8 URL pattern. Requests returned no usable images in the development browser. Image availability, naming, and access restrictions vary. A successful image load does not prove product/colour correctness: review all images.

The Google Images button opens a manual search; it does not collect search results. Direct image URLs and catalog image columns are the supported fallback. PDF catalogs and embedded Excel pictures are not extracted.

The next milestone is to integrate an approved product image feed or a documented image-search API using a server-side secret. Validate retrieval on a small set of real item codes before expanding to bulk searches. Do not bypass website access restrictions or substitute generated images.

## Excel output

| Handle | Item Code | Image Position | Image Src | Image Alt Text |
| --- | --- | --- | --- | --- |
| old-skool | VN000D3HY28 | 1 | https://example.com/hero.jpg | VN000D3HY28- hero view |
| old-skool | VN000D3HY28 | 2 | https://example.com/side.jpg | VN000D3HY28- Alt 1 |
| old-skool | VN000D3HY28 | 3 | https://example.com/back.jpg | VN000D3HY28- Alt 2 |

Example URLs above are illustrative. Every retained image becomes a row, with the same product handle and item code repeated. This is the requested workbook schema, not a complete Shopify product-import template.

## Data and dependencies

Catalogs are parsed in the browser and are not uploaded to this Node.js server. The workspace is stored in this browser on this origin. External image hosts receive requests when images are checked/displayed; manual Google searches contain the item code. Exported URLs remain dependent on their hosts.

SheetJS Community Edition 0.20.3 is installed from its official distribution URL and served locally as `/xlsx.js`. No runtime CDN script is required. This is an independent operations tool, not an official Vans application.

## Checks

```bash
npm run check
npm test
```

Tests cover product-code deduplication, vertical export fields, hero reordering and position renumbering. Live image discovery requires separate verification with a usable image source.
