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
- **Design System date (rule 18c)** - `GET /docs/api/design-system-updated.json` answers with the date the Design System Figma file was last updated. It reports the newest **named** version, not the file's `last_touched_at`, because the design team labels a version `Published to Community hub` on every publish - so the named version is the date of the file readers can actually download, while `last_touched_at` is whenever a designer last nudged a frame. On 2026-09-16 those were 2026-08-20 and 2026-09-11 respectively, three weeks apart. If that convention ever lapses the endpoint falls back to `last_touched_at` and the field relabels itself, so it degrades rather than lying. Two pages show it as a field - the design system guide and the newest `changelog-<N>` page (the one the sidebar links, not the unlinked rolling `changelog/changelog.md`) - both marking the spot with a `data-design-system-updated` element that `public/scripts/design-system-updated.js` fills in. It needs **`FIGMA_FILE_KEY`** (the key of the Figma file to report on - the segment after `/design/` in that file's URL, *not* the numeric id of its Community listing) plus a credential, and the choice of credential matters because **every simple Figma token expires**:

  | Credential | Secrets | Expires |
  |---|---|---|
  | OAuth app (**use this**) | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`, `FIGMA_REFRESH_TOKEN` | no - the refresh token is exchanged for a new access token on each read |
  | Personal access token | `FIGMA_TOKEN` | **90 days**, Figma's hard maximum |
  | Plan access token | `FIGMA_TOKEN` | 1 year, and Organization/Enterprise plans only - this account is on Professional |

  A personal access token would take the date down roughly four times a year, silently, so treat it as a way to prove the endpoint works and nothing more. The worker prefers OAuth whenever all three OAuth secrets are set, and only falls back to `FIGMA_TOKEN` otherwise; a half-configured OAuth setup keeps using the personal token rather than going dark mid-migration.

  **Scopes - exactly two, whichever credential you use:** `file_versions:read` (for `/v1/files/:key/versions`, the named-version date this normally reports) and `file_metadata:read` (for `/v1/files/:key/meta`, the `last_touched_at` fallback used when the file has no named versions). Nothing else, and no write scope. Do **not** grant `files:read` - it covers both, but Figma's own spec marks it `Deprecated`, and it also hands out files, projects, users, comments, components, styles and webhooks, which is far more than reading one date needs.

  To get the OAuth secrets: create an app at <https://www.figma.com/developers/apps>, request those two scopes, complete the authorization code flow once as a user who can open the file, and keep the `refresh_token` from the response. The worker POSTs it to `/v1/oauth/refresh` with HTTP Basic auth on each cache miss - about once a day per edge location - and calls the API with `Authorization: Bearer`. Figma returns no new refresh token, so the stored one is reused indefinitely. Because the endpoint reads daily, the refresh token never sits idle long enough to lapse.

  This site deploys as a **Cloudflare Pages** project, not a standalone Worker, so these are Pages variables and `wrangler secret put` does not apply. Set them per project - `handsontable-docs` (production) and `handsontable-docs-staging` - in the dashboard: **Workers & Pages** > the project > **Settings** > **Variables and Secrets** > **Add**, then tick **Encrypt** and save. Pages keeps Production and Preview separate, so set both if the date should also show on PR previews. **A secret only reaches the worker on the next deployment after it is set**, so a value added to a project that has already built does nothing until it redeploys.

  **Getting it to the live site takes a hand port.** `docs-sync.yml` carries only `docs/content/**` and `docs/public/img/**` to `prod-docs/<major>.<minor>`, and this feature also lives in `cloudflare/_worker.js`, `astro.config.mjs` and `public/scripts/design-system-updated.js` - all outside that set. So the sync ports the two page lines and nothing that makes them fill in, and the field stays hidden on the live site until someone cherry-picks the rest. It degrades safely, which is exactly why it can be forgotten.

  Never put the token in code or in client JavaScript, where it would be public. **Until both are set the endpoint answers `{"date": null}` and the fields stay hidden**, which is the intended fallback and also the first thing to check if the date never appears. The read is server-side for a second reason too: `api.figma.com` is not in the site's `connect-src`, so a browser could not call Figma directly even with a token.

## Tests

`__tests__/*.test.mjs` covers the redirect and rewrite rules. Run them with:

```bash
npm run docs:test:plugins
```

Add a case here whenever you add or change a rule - there is no other automated coverage for this file.
