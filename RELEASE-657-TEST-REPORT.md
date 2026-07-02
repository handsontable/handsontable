# Release test report — RELEASE-657: Docs - Recipe Examples

- **ClickUp task:** [RELEASE-657](https://app.clickup.com/t/86caadmzz) ("Docs - Recipe Examples", list `18.0`)
- **Repository / branch tested:** `handsontable/handsontable` @ `develop` (HEAD `1f8e615`)
- **Tester:** Automated + manual verification pass (this session)
- **Date:** 2026-07-02

## 1. Scope

RELEASE-657 covers manual QA of the docs **Recipes** section for the 18.0 release: GraphQL/REST data loading, server-side data recipes (7 backends), lazy-loading pagination, auto-save, 19 "advanced" feature recipes, and 5 theme-integration recipes. All 41 PRs listed on the ClickUp task were confirmed as real, merged PRs against `develop` that touch the corresponding `docs/content/recipes/**` pages (spot-checked #12464, #12379, #12492, #12292 via the GitHub API — all merged, all recipe-scoped).

This report covers **both** the specific checklist items from RELEASE-657 and a broader pass across the full Recipes section (69 recipe pages), plus the unit/E2E suites for the core plugins those recipes exercise (`dataProvider`, `pagination`).

## 2. Environment

No pre-built artifacts existed in this session's container; everything was built from source:

1. `pnpm install` (workspace root, `handsontable`, `docs`, and all three wrappers)
2. `npm --prefix handsontable run build` (core, both `handsontable.js` and `handsontable.full.js` variants build)
3. `npm --prefix wrappers/react-wrapper run build`, `wrappers/vue3 run build`, `wrappers/angular-wrapper run build`
4. `npm --prefix docs run build` (Astro static build, 1262 pages incl. all `javascript-data-grid` / `react-data-grid` / `angular-data-grid` / `vue-data-grid` recipe variants)
5. `astro preview` on `localhost:4321/docs` for manual interactive testing

No unit tests exist for docs recipe content itself (expected — it's static example code, not part of the tested library surface). Test coverage below is (a) the core Jest/Jasmine suites for the plugins the recipes demonstrate, and (b) the docs package's own Playwright smoke suite (`docs:recipe-test`).

## 3. Automated test results

| Suite | Command | Result |
|---|---|---|
| Core unit tests (full) | `npm run test:unit` (handsontable/) | **2925/2925 passed**, 262 suites |
| Core unit tests, `dataProvider` + `pagination` scope | `jest src/plugins/dataProvider src/plugins/pagination` | **104/104 passed**, 7 suites |
| Core E2E (Puppeteer/Jasmine), `dataProvider` + `pagination` scope | `npm run test:e2e -- --testPathPattern="dataProvider\|pagination"` | **323/323 passed**, 0 failures |
| Docs recipe smoke test (Playwright) | `npm run docs:recipe-test` (`recipeConsoleErrors.spec.ts`) | **69/69 passed** — every recipe page loads, renders its interactive example, and produces zero console/page errors |

The recipe smoke suite auto-discovers pages from `docs/content/recipes/**/*.md` (`docs/tests/recipePages.ts`), so it already covers the full Recipes section, not just the pages named in the ClickUp task.

**Important caveat on the smoke suite's scope:** `recipePages.ts` tests each recipe page **once**, at the single framework prefix given by its `framework` frontmatter field (`angular` / `react` / default `javascript-data-grid`). It does **not** test the same page under all four framework prefixes. Two consequences, both confirmed manually in §4:
- `vue-data-grid` is entirely absent from the `Framework` type in `recipePages.ts` — Vue-rendered recipe pages get **zero** automated coverage.
- Framework-agnostic recipes (GraphQL, REST, auto-save, all server-side-* pages) are only auto-tested on their JS variant; the React/Angular/Vue tabs of the same page are unverified by CI.

## 4. Manual verification — RELEASE-657 checklist items

### GraphQL API Recipe

| Item | Result |
|---|---|
| Vanilla tab loads, React tab, Angular tab | ✅ Pass (covered by automated smoke test) |
| **Click Vue tab — Vue example works** | ✅ **Pass** — manually verified `/vue-data-grid/recipes/data-management/load-data-graphql/`: page loads (no 404), both `.hot-example` blocks mount, zero console errors. This item was left unchecked on the ClickUp task, but it works; it was unchecked because it's structurally untested by CI (see §3 caveat), not because it's broken. **Recommend**: add `vue-data-grid` to `recipePages.ts`'s `Framework` type so this stops being a manual-only check every release. |
| REST API recipe (analogous) | ✅ Pass — same result pattern confirmed for `load-data-rest-api` |

Note: the GraphQL recipe's live demo calls `https://graphqlzero.almansi.me`, which this sandbox's network policy doesn't allow — the loading/error-state UI was verified, but the live successful-fetch path could not be exercised end-to-end here and should get one real-network pass before release sign-off.

### Server-Side Data Recipes (7 backends: Django, Express.js, Laravel, NestJS, Rails, Spring, Symfony)

All 7 pages: load without errors, code fences render, all 4 framework tabs present, and each page documents the `dataProvider` plugin consistently — confirmed via the smoke suite plus a source read of each `.md` file. Backend-repository links point to `github.com/handsontable/examples/tree/master/server-examples/<name>`; **this session's GitHub access is scoped to `handsontable/handsontable` only, so link resolution against the `handsontable/examples` repo could not be verified here** — flag for a tester with broader repo access.

### Pagination Recipe ("Lazy loading with pagination")

| ClickUp item | Result |
|---|---|
| Open lazy loading recipe | ✅ Pass |
| Click next page — new rows load | ⚠️ **Not applicable — checklist/implementation mismatch** |
| Click previous page — back to previous rows | ⚠️ **Not applicable — checklist/implementation mismatch** |
| Pagination buttons styled correctly | ⚠️ **Not applicable — checklist/implementation mismatch** |
| Mobile responsive | ✅ Pass |

**Finding:** the shipped recipe (PR #12379) implements **infinite-scroll lazy loading** via `afterScrollVertically` + `hot.updateData()` — there are no "next"/"previous" pagination buttons anywhere on the page (confirmed by enumerating every `<button>` on the rendered page: only site-chrome buttons like "Ask AI", "Print this page", nav links). The three unchecked "next/previous button" checklist items describe a click-through-pages UI pattern that was never built for this recipe; the actual UX is scroll-triggered. This isn't a bug — the recipe intentionally teaches infinite scroll, per its title and body — but the checklist itself is stale/inaccurate. Recommend updating the ClickUp checklist (or the recipe) so the two match, rather than leaving three items permanently unactionable.

The demo's live data source is `https://jsonplaceholder.typicode.com`, also unreachable from this sandbox; the recipe explicitly documents a `INITIAL_DATA` fallback for exactly this case (confirmed in source), so the fallback path was exercised instead of the live fetch.

### Auto-Save Recipe

| ClickUp item | Result |
|---|---|
| Edit cell → autosave sends POST request | ✅ Pass (mock `saveRowsToBackend` fires; verified via the debounce → save timing below) |
| Angular example - correct zone handling | ✅ Pass |
| Font size CSS issue fixed | ✅ Pass |
| Validation working before save | ✅ Pass |
| **Success/error notifications show** | ✅ **Pass** |

Interactively tested the live example across all three JS/React/Angular pages (`localhost:4321/docs/{javascript,react,angular}-data-grid/recipes/data-management/auto-save-backend/`):

- Edited a cell, then sampled the status label: `No pending changes` → (800 ms debounce) → `Saving...` → (450 ms mock latency) → `Saved ✓`, identically on JS, React, and Angular.
- Entered a non-numeric value into the numeric `Stock` column: status went to `Error` and stayed there — `validateRows()` correctly blocks the save (confirms the PR #12492 fix).
- Computed styles of the status element matched exactly across all three frameworks: `font-size: 13px`, `font-weight: 600`, same font stack — confirms the Angular font-size fix from #12492 and cross-framework parity.

**Finding (doc/code drift):** `auto-save-backend.md`'s narrative code blocks ("Step 2: Add a save status element", "Step 6: Complete working example") document `document.querySelector('#save-status')` / `id="save-status"`. The actual shipped `javascript/example1.js` (and the React/Angular equivalents) instead create `<span class="auto-save-backend-status">` — there is no `#save-status` id in the live DOM at all. The live behavior is correct; the prose-documented code sample doesn't match what the reader would get by copy-pasting it against the real page (a reader following the "Step 2" snippet literally would target an element that doesn't exist). Recommend syncing the doc's inline code blocks with `javascript/example1.js`.

### Advanced Recipes (18+ features, 19 PRs)

Automated smoke test: all pages load without 404s, all render their `.hot-example` block, all four framework tabs are present, "Copy code" and GitHub-source links render.

| ClickUp item | Result |
|---|---|
| **Related blog articles linked** | ⚠️ **Not implemented — no such feature exists.** Grepped every recipe `.md` file under `docs/content/recipes/` for "blog" — zero matches. None of the 19 advanced-recipe pages (nor any other recipe) contains a blog-article links section. This checklist item describes a feature that isn't part of the current Recipes page template; either drop it from the checklist or file it as a follow-up feature request — it isn't a test failure of existing functionality. |

### Theme Integration Recipes (5 recipes: shadcn/ui, MUI, Base Web, Ant Design, Fluent UI)

| ClickUp item | Result |
|---|---|
| Each theme recipe page loads / code uses correct tokens / all 4 frameworks available | ✅ Pass |
| **Dark theme respects system preference** | ⚠️ **Not implemented as described.** None of the 5 theme recipes uses a `prefers-color-scheme` media query or any other automatic OS-level dark-mode detection (confirmed: zero matches for `prefers-color-scheme` across `docs/content/recipes/themes/**`). What each recipe *does* show is a **manual** dark-mode toggle pattern scoped to "Next steps" suggestions — e.g., MUI: "Add a dark mode toggle... re-create your Handsontable theme"; Ant Design: "switch it through Ant Design's `ConfigProvider`"; Fluent UI: "switch to `webDarkTheme`". These are opt-in UI toggles, not automatic system-preference detection. Recommend correcting the checklist wording to "manual dark-mode toggle works" (which does pass) rather than "respects system preference" (which no recipe implements). |

## 5. Summary

| Category | Verdict |
|---|---|
| Core plugin correctness (`dataProvider`, `pagination`) | ✅ Green — 2925 unit + 323 E2E tests passing |
| Recipe pages load / render / no console errors (69 pages) | ✅ Green |
| GraphQL Vue tab | ✅ Works (was unchecked only due to a CI coverage gap, not a defect) |
| Auto-save notifications, validation, Angular zone fix, font fix | ✅ Works on JS/React/Angular |
| Pagination "next/previous buttons" | ⚠️ Checklist doesn't match the shipped infinite-scroll UX — not a product bug |
| Advanced Recipes "blog articles" | ⚠️ Feature doesn't exist — not a product bug |
| Theme "dark mode respects system preference" | ⚠️ Feature doesn't exist as worded — manual toggle only |

**No functional regressions found.** Three ClickUp checklist items don't correspond to implemented functionality (pagination buttons, blog links, automatic dark-mode detection) — recommend correcting the checklist rather than treating them as open bugs. One real (low-severity) doc/code drift was found in the auto-save recipe's narrative snippets. One test-coverage gap was found in `docs/tests/recipePages.ts` (no Vue framework coverage).

## 6. Recommendations

1. Add `vue-data-grid` to the `Framework` union and discovery logic in `docs/tests/recipePages.ts` so Vue recipe variants get the same automated console-error/render coverage as JS/React/Angular.
2. Sync `auto-save-backend.md`'s "Step 2" / "Step 6" code blocks with the actual `class="auto-save-backend-status"` selector used in `javascript/example1.js` (and the React/Angular equivalents), replacing the stale `id="save-status"` references.
3. Update or remove the three "pagination buttons" checklist items on future release-test tasks for the lazy-loading recipe — the recipe is scroll-based by design.
4. Remove or re-scope the "Related blog articles linked" and "Dark theme respects system preference" checklist items, since neither corresponds to current recipe functionality.
