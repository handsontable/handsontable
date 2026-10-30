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
- **Versions that are not deployed (`OLDEST_DEPLOYED_DOCS_MAJOR`, rule 12b)** - only versions from 9.0 up are deployed, and only as `MAJOR.MINOR`. Rule 12b sends a URL of any older version (`/docs/7.4/...`, `/docs/7.4.2/...`, `/docs/0.15.0-beta5/...`) to the current docs: a known `{page}.html` slug goes through `FLAT_HTML_MAP` to its page, anything else to the framework home. A deployed version written with a patch (`/docs/9.0.1/...`) goes to its `MAJOR.MINOR` docs. Before this rule, rules 13 and 14 sent the older versions to a `/docs/7.4/...` path that answered 404 - 46% of the docs 404 views in the 30 days to 2026-10-29. When `MIN_DOCS_VERSION` in `deploy/getListOrPreviousVersions.mjs` goes up, raise the constant with it, or the dropped versions dead-end again.
- **`crossFramework` map** - the place to add a redirect for a renamed or removed page. See `README-DEPLOYMENT.md` ("Redirects") for the add/rename workflow.

## Tests

`__tests__/*.test.mjs` covers the redirect and rewrite rules. Run them with:

```bash
npm run docs:test:plugins
```

Add a case here whenever you add or change a rule - there is no other automated coverage for this file.
