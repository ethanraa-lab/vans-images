# GitHub Pages edition

The user has paused login and approved a publicly accessible test website. The browser-only build is separate from the Node.js/Render edition.

## Enable publication

1. Open repository Settings → Pages.
2. Under Build and deployment, choose GitHub Actions.
3. Open Actions → Publish GitHub Pages and run the workflow on main (or rerun the latest run).
4. Use the URL shown by the successful deployment, not a guessed URL.

GitHub Free supports Pages on public repositories. Private repositories require an eligible paid GitHub plan. If Settings says to upgrade or change repository visibility, stop and ask the owner to choose. Approval to publish a website does not mean approval to publish the full repository or its history.

## Included

Excel/CSV import with column mapping; pasted item codes; imported/pasted direct image URLs; remove images; hero selection and ordering; vertical Excel export; JSON workspace backup/restore.

No login, API key input, secret, or automatic web-search API is included. The Google Images link opens a manual search. Optional Vans CDN lookup is best-effort and may return no images. Catalogs and retained URLs are stored in this browser, not uploaded to GitHub. External image hosts receive requests when images are checked or displayed.

## Build

Run npm ci, then npm run build:pages. The output pages-dist/ contains only index.html, app.js, xlsx.js and .nojekyll. All assets use relative paths for project-site hosting. Backend files, login code and environment files are excluded.

The workflow builds and deploys pages-dist. The Node.js app retains its original server-side authentication; changing Pages does not unlock the existing Render service.
