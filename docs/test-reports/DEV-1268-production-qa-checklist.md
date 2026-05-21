# QA Test Report: Astro Docs Production Mode

**Task:** [DEV-1268](https://app.clickup.com/t/9015210959/DEV-1268) - QA: Test Astro docs in production mode (full pre-deploy checklist)
**Handsontable version:** 17.1.0
**Report date:** 2026-05-21
**Tester:** Radoslaw Cichocki
**Environment:** Production build (`BUILD_MODE=production npm run build && npm run preview`)
**Base URL under test:** `http://localhost:4321/docs/` (local preview) / `https://handsontable.com/docs` (live)

---

## How to run

```bash
cd docs
npm install
BUILD_MODE=production npm run build
npm run preview
# Opens at http://localhost:4321/docs/
```

> Use `npm run build -- --force` if content looks stale (busts Astro data store cache).

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| PASS | Verified and passing |
| FAIL | Verified and failing - action required |
| SKIP | Not applicable for this release |
| TODO | Not yet tested - requires runtime verification |

---

## 1. Build integrity

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.1 | `npm run build` completes with zero errors and zero warnings | TODO | Run `BUILD_MODE=production npm run build` and inspect terminal output |
| 1.2 | `dist/` directory is populated with expected static HTML files | TODO | Verify `docs/dist/` exists and contains `.html` files after build |
| 1.3 | No broken imports or missing asset references in build output | TODO | Check for any 404 errors in the Astro build log |

**Static analysis findings:**
- `build` script runs `npm run docs:api` before `astro build` - confirm `docs:api` completes successfully.
- `BUILD_MODE` env var must be set to `production` for GTM, HotJar, and Algolia DocSearch to be injected.

---

## 2. Sitemap & SEO

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.1 | `dist/sitemap-index.xml` exists and is accessible at `/docs/sitemap-index.xml` | TODO | Open `http://localhost:4321/docs/sitemap-index.xml` after preview |
| 2.2 | Paginated sitemap variants (`sitemap-0.xml` etc.) list all major pages | TODO | Inspect linked sitemap files; verify guides, API reference, recipes, changelog are listed |
| 2.3 | No `noindex` meta tags leaking onto production pages | TODO | Spot-check `<meta name="robots">` in page source on a guide and API page |
| 2.4 | `<canonical>` tags point to `https://handsontable.com/docs/...` (not `localhost` or staging) | TODO | View source on a guide page and inspect `<link rel="canonical">` |
| 2.5 | `<title>` tags are unique per page and not generic fallbacks | TODO | Compare `<title>` of at least 3 different pages in source |
| 2.6 | `<meta name="description">` present on key pages | TODO | Check source on index, a guide, and an API page |
| 2.7 | Open Graph tags present (`og:title`, `og:description`, `og:url`, `og:image`) | TODO | View source and search for `og:` meta tags |
| 2.8 | No `X-Robots-Tag: noindex` headers from Netlify config | TODO | Use browser DevTools Network panel → check response headers on any page |

**Static analysis findings:**
- `site: 'https://handsontable.com'` and `base: '/docs'` are correctly set in `astro.config.mjs:633-634`. Canonical URLs will be generated against the production domain.
- `@astrojs/sitemap` integration is present (`astro.config.mjs:781`). Sitemap will be generated during build.
- No `noindex` meta tags found in `src/` component source (Astro components reviewed: `Head.astro`, `Header.astro`).
- No `X-Robots-Tag` headers found in `netlify/_dev_headers` or `netlify/netlify.toml`.
- OG tags: Starlight generates `og:title` and `og:description` automatically from page frontmatter. Custom `og:image` (`handsontable-banner-og.png`) is in `public/` - verify it appears in rendered `<head>`.

---

## 3. Algolia Search

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.1 | Search box renders correctly in the production build | TODO | With `BUILD_MODE=production`, confirm search input appears in header |
| 3.2 | Searching a term returns results | TODO | Search "cell type" or "plugin" - confirm results appear from Algolia |
| 3.3 | Search results link to correct production URLs (`handsontable.com/docs/...`) | TODO | Click a result and verify the URL is the production domain |
| 3.4 | Algolia DocSearch crawl triggered/scheduled for this version | TODO | Confirm with team or check Algolia dashboard |
| 3.5 | No JS console errors related to the `docsearch` bundle | TODO | Open browser DevTools Console - no red errors from docsearch |

**Static analysis findings:**
- `starlightDocSearch` is only injected when `BUILD_MODE === 'production'` (`astro.config.mjs:754`). Non-production builds hide search via `shouldRenderSearch` in `Header.astro`.
- Algolia credentials: `appId: 'MMN6OTJMGX'`, `apiKey: 'c2430302c91e0162df988d4b383c9d8b'`, `indexName: 'handsontable'` (`astro.config.mjs:757-759`).
- `pagefind: false` is set - search is 100% Algolia-driven in production.

---

## 4. Changelog

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 4.1 | Changelog page renders at `/docs/javascript-data-grid/changelog/` with latest release entries | TODO | Navigate to the changelog URL and verify 17.x entries are visible |
| 4.2 | `npm run docs:api` was run before the production branch was created | TODO | Confirm CI ran `docs:api` or run it manually before branching |
| 4.3 | Changelog PR links and version anchors resolve correctly | TODO | Click several PR/issue links in the changelog - verify they open correctly |
| 4.4 | No duplicate or malformed entries visible | TODO | Scroll through the changelog and check for repeated or broken entries |

**Static analysis findings:**
- Changelog content exists at `content/guides/upgrade-and-migration/changelog/`.
- Version-specific changelogs exist up to `changelog-17/` (covering 17.0/17.1).
- `npm run docs:api` is already integrated into the `build` script (`package.json`), so it runs automatically during `npm run build`.

---

## 5. Navigation & routing

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5.1 | Sidebar links - spot-check Guides, API Reference, Recipes, Changelog - no 404s | TODO | Click through each top-level sidebar section; verify each link loads |
| 5.2 | Version switcher redirects correctly between versions | TODO | Switch between JavaScript / React / Angular framework tabs - verify redirects work |
| 5.3 | `/docs/` root redirects to the latest version correctly | TODO | Open `/docs/` and verify redirect to `javascript-data-grid/` |
| 5.4 | Deep links / anchor links work in production | TODO | Copy a `#section` anchor URL and navigate to it; verify page scrolls to correct heading |
| 5.5 | Custom 404 page served for unknown URLs | TODO | Open `/docs/this-page-does-not-exist` and verify the custom 404 page appears |

**Static analysis findings:**
- `_redirects` file (`netlify/_redirects`) contains extensive redirect rules including `/` -> `/docs` root redirect and Angular version-specific redirects.
- Framework-specific routing is handled by sidebar configuration in `astro.config.mjs:728-737` (JavaScript, React, Angular sidebar groups).
- A `404.html` is referenced in `build_current_version.sh`.

---

## 6. Interactive code examples

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.1 | Examples embedded in guides render (CodeSandbox microservice) | TODO | Open a guide page with an embedded example (e.g. Getting Started) and verify example loads |
| 6.2 | React, Angular, Vue, and vanilla JS variants all load without errors | TODO | Toggle framework tab on an example with all 4 variants - verify each loads |
| 6.3 | No CORS errors in browser console | TODO | Open DevTools Console while examples load - confirm no CORS errors |

---

## 7. API Reference

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7.1 | API reference pages (`/docs/api/...`) are present and populated, not blank | TODO | Navigate to `/docs/javascript-data-grid/api/` - verify content is visible |
| 7.2 | API content is current with 17.1.0 release version | TODO | Check a recently added or changed API member (method/option/hook) - verify it appears correctly |

**Static analysis findings:**
- API content at `content/api/` contains `introduction.md`, `plugins.md`, and sidebar configuration. The bulk of API content is generated by `npm run docs:api` from JSDoc.

---

## 8. Assets & rendering

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8.1 | All images load - no broken `<img>` tags | TODO | Open a guide page with images and check Network panel for 404s on image requests |
| 8.2 | CSS fully applied - no unstyled flash or layout breaks | TODO | Navigate between several pages; verify no flash of unstyled content (FOUC) |
| 8.3 | Static assets from `public/` served correctly (favicons, fonts, OG images) | TODO | Check `<link rel="icon">` favicon loads; verify OG image is accessible at `/docs/handsontable-banner-og.png` |
| 8.4 | No `localhost` or `dev.handsontable.com` URLs leaking in production HTML | TODO | View page source on a guide and search for `localhost` / `dev.handsontable.com` |

**Static analysis findings:**
- Light and dark favicons are configured: `Head.astro` injects `<link rel="icon" media="(prefers-color-scheme: light/dark)">` pointing to `/docs/img/favicon.png` and `/docs/img/favicon-dark.png`.
- OG image `handsontable-banner-og.png` exists in `public/`.
- GTM and HotJar scripts are only injected when `isProduction === true` - no analytics URL leakage in non-production builds.

---

## 9. Netlify-specific

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 9.1 | Netlify redirect rules work as expected - test key redirects manually | TODO | Test: `/docs/` -> latest version, `/docs/15.3/angular-data-grid/` -> `/docs/angular-data-grid/` |
| 9.2 | Correct `prod-docs/17.1` branch selected in GitHub Actions workflow | TODO | Verify the GitHub Actions Docs Production Deployment workflow targets `prod-docs/17.1` |
| 9.3 | Netlify deploy log shows no build errors post-deploy | TODO | Check Netlify dashboard build log for the active deployment |
| 9.4 | `prod-docs/latest` branch updated (auto-handled by CI - confirm) | TODO | Verify `prod-docs/latest` points to the 17.1 build after deploy |

**Static analysis findings:**
- `netlify/netlify.toml` has the base build config. Production deploy uses `build_current_version.sh` which pulls from Docker image `ghcr.io/handsontable/handsontable/handsontable-documentation:v<VERSION>`.
- Redirect rules in `netlify/_redirects` include Angular version compat redirects (15.3 through 9.0 -> latest Angular docs or JavaScript docs).
- `getListOrPreviousVersions.mjs` determines `LATEST_VERSION` and `PREVIOUS_VERSIONS` automatically.

---

## 10. Visual regression (recommended)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 10.1 | Run `npm run docs:visual-test` against `npm run preview` and compare to baseline | TODO | Run Playwright visual tests against the preview server and check for unexpected diffs |
| 10.2 | Update baseline screenshots for intentional visual changes | TODO | If visual changes are intentional, run `npm run docs:visual-test:update-screenshot` to update baselines |

**Static analysis findings:**
- Playwright config exists at `docs/playwright.config.ts`.
- Visual test scripts are defined: `docs:visual-test` and `docs:visual-test:update-screenshot` in `package.json`.

---

## Summary

| Section | Total checks | PASS | FAIL | SKIP | TODO |
|---------|-------------|------|------|------|------|
| 1. Build integrity | 3 | 0 | 0 | 0 | 3 |
| 2. Sitemap & SEO | 8 | 0 | 0 | 0 | 8 |
| 3. Algolia Search | 5 | 0 | 0 | 0 | 5 |
| 4. Changelog | 4 | 0 | 0 | 0 | 4 |
| 5. Navigation & routing | 5 | 0 | 0 | 0 | 5 |
| 6. Interactive code examples | 3 | 0 | 0 | 0 | 3 |
| 7. API Reference | 2 | 0 | 0 | 0 | 2 |
| 8. Assets & rendering | 4 | 0 | 0 | 0 | 4 |
| 9. Netlify-specific | 4 | 0 | 0 | 0 | 4 |
| 10. Visual regression | 2 | 0 | 0 | 0 | 2 |
| **Total** | **40** | **0** | **0** | **0** | **40** |

---

## Notes

- All checks require a production build (`BUILD_MODE=production npm run build`). The dev server (`npm run dev`) does not reflect production behavior.
- Algolia search and GTM/HotJar are only present when `BUILD_MODE=production` is set at build time. Running `npm run build` without this env var will produce a build without search.
- The pre-built Docker images for previous versions are used at deploy time; only the current version (17.1.0) is built from source.
