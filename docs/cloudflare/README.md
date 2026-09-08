# Cloudflare Pages worker

`_worker.js` is the sole, hand-maintained authority for every redirect and rewrite the documentation site needs - production, staging, and PR previews. Cloudflare Pages ignores `_redirects` entirely once a `_worker.js` is present, so nothing outside this file has a say in routing.

There is no generator: when you add, rename, or remove a documented page, update the rules here directly.

## Where the rules live

The current, authoritative, priority-ordered rule list is the comment block at the top of [`_worker.js`](./_worker.js) (`Redirect priority order (first match wins)`). Read that comment before changing routing behavior - it is kept in sync with the code on every change, which a prose duplicate in this file would not be.

This README intentionally does not re-list every rule. The Netlify-era equivalent (`docs/netlify/netlify/edge-functions/readme.md`, removed when Netlify was dropped) went stale within weeks of being written - newer rules like the Vue 3 legacy redirects, the latest-version redirect, and the recipe cell-type slug fixes were never added to it. Keeping the rule list in one place (the code comment) is the fix.

## Concepts worth knowing before you touch this file

- **Framework preference cookie** - `docs_fw` (read via `getCookie()`/`getFrameworkFromCookie()`) stores the reader's last-chosen framework (`react`, `angular`, or the `javascript-data-grid` default). Several rules use it to route framework-agnostic URLs (`/docs`, `/docs/some-page.html`) to the right framework's page.
- **Latest-version redirect (`LATEST_VERSION`, rule 1b)** - the `__LATEST_DOCS_VERSION__` placeholder is substituted at deploy time (see `docs-production.yml`'s "Add Cloudflare worker to production deploy" step) with the latest released `MAJOR.MINOR`, so versioned URLs for the current release also resolve at the unversioned `/docs/...` root. Unsubstituted (e.g. on staging, which has no versioned docs), the rule's `\d+\.\d+` guard makes it a no-op.
- **Pre-16 Angular / pre-12.1 framework routing** - older docs versions predate per-framework content and are either served as-is (rewrite) or collapsed to `javascript-data-grid` (redirect), depending on version. See rules 3 and 14 and the `isFrameworkVersion` checks throughout the file.
- **Legacy-host collapse (`LEGACY_DOCS_HOSTS`, rule 12a)** - `docs.handsontable.com` is still bound to the production Pages project, so without this rule it answers `200` for the whole `/docs` tree and the documentation is live on two hostnames. Two pieces work together: `abs()` swaps in the canonical origin for a legacy host, so every rule above 12a crosses hosts in one hop with its destination already resolved, and rule 12a itself `301`s whatever those rules did not match. Its position - immediately before the first cookie-reading rule - is deliberate, and moving it breaks one of two things. Push it later and the `302` rules (13-17) answer first, which never de-indexes the legacy URL and reads the cookie from the wrong host's jar. Push it earlier and non-`/docs` paths (`/`, `/0.8.0/*`, `/demo/*`, `/customers/*`) get host-swapped onto `handsontable.com`, where only `/docs/*` reaches this worker, so they land on the marketing site or a 404. **A rule that serves content rather than redirecting must go below 12a**, or it answers `200` on a legacy host.
- **`crossFramework` map** - the place to add a redirect for a renamed or removed page. See `README-DEPLOYMENT.md` ("Redirects") for the add/rename workflow.

## Tests

`__tests__/*.test.mjs` covers the redirect and rewrite rules. Run them with:

```bash
npm run docs:test:plugins
```

Add a case here whenever you add or change a rule - there is no other automated coverage for this file.
