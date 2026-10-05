---
name: handsontable-playwright-e2e
description: Use when writing or modifying real-browser Playwright E2E / functional tests for Handsontable (specs in tests/e2e/, core, wrappers, or walkontable). Covers the Page Object Model, hooking in by data-testid, deterministic web-first waits, wrapper-specific gotchas, recording via the CLI, and the new-vs-modify / E2E-vs-unit decision. NOT for screenshot/visual tests (use visual-testing) or the legacy Jasmine suite (use handsontable-e2e-testing).
---

# Handsontable Playwright E2E authoring

New E2E is **Playwright** in `tests/e2e/` (`*.spec.ts`). The legacy Jasmine `*.spec.js` suite is frozen: add new specs only in Playwright. Reference: `tests/e2e/grid.spec.ts` + `tests/fixtures/pages/GridPage.ts`.

## Where tests run

Locally, run only the specs you created or changed, under the default theme:
`cd tests && npx playwright test --project=e2e-main e2e/<your-spec>.spec.ts`.
The Stop hook and pre-push do this automatically. Every spec is parametrized across a theme (main/horizon/classic) × bundle (`umd` = `handsontable.js`, `full-min` = `handsontable.full.min.js`) matrix, six projects; CI runs all of them (`E2E / Playwright <bundle> (theme: …)`). Local gates run `e2e-main` (plain UMD) only. To run all legs for one spec, drop `--project`: `npx playwright test e2e/<your-spec>.spec.ts`. Tests tagged `@cross-browser` (`{ tag: CROSS_BROWSER_TAG }` from `fixtures/test.ts`) also run on Firefox and WebKit through `playwright-engines.config.ts` (one CI job); tag a test whose behavior an engine could get wrong on its own — real keys, pointer gestures, focus, DOM-read layout. `tests/AGENTS.md` → "The engine legs" has the local command.

### Check port 8123 before you believe a local result

`webServer` uses `reuseExistingServer`, so Playwright attaches to whatever already listens on 8123 (a worktree beside the main clone, a leftover `support/static-server.mjs`) and your specs exercise a build you did not make, with no signal in the output.

```bash
lsof -nP -i :8123 | grep LISTEN     # empty = free, safe to run
```

If it is taken and not yours, leave it running (another session may be mid-run) and use your own port:

```bash
cd tests && HOT_TEST_PORT=8131 npx playwright test --project=e2e-main e2e/<your-spec>.spec.ts
```

`HOT_TEST_PORT` is read by `tests/playwright.config.ts` and throws on a malformed or empty value. It applies to the functional suite only; the visual suite's port is owned by `visual-tests/src/config.mjs` plus two hardcoded `app.listen(8082)` demo servers.

### Rebuild both bundles before an all-legs run

`build:umd` writes `dist/handsontable.js` only; the `-min` legs load `handsontable.full.min.js` from `build:umd.min`. Run the full task and check both files moved:

```bash
npm --prefix handsontable run build
ls -l handsontable/dist/handsontable.js handsontable/dist/handsontable.full.min.js
```

Read a mixed result per leg: a split along the bundle axis is about the bundles, not timing (stale bundle vs genuine `full.min` difference: `tests/AGENTS.md`).

## Five rules

1. **Page Object Model.** A spec expresses intent; selectors and multi-step flows live in a page object under `tests/fixtures/pages/`.
2. **Hook by `data-testid`, not structural CSS.** Stamp ids in the fixture (or add them to the component when it removes ambiguity). Fall back to role/text locators before grid internals.
3. **Web-first waits only.** `await expect(locator).toBeVisible()`; await every assertion. Inside a page object the same rule has six shapes lint cannot see (`setTimeout` in `page.evaluate()`, a `waitForFunction` without `{ polling }`, a scroll method that ends on `scrollTop`, `.at(-1)` on a separately read log, a fixture build that fails silently, a negative settle with no positive control), spelled out in `references/determinism.md`.
4. **Isolation.** One instance per test; `page.route()` / `page.clock()` for network/time. `failOnFlakyTests` is on in CI: pass-on-retry is a hard failure.
5. **Thread the bundle axis.** Import `test` from `tests/fixtures/test.ts`, destructure `{ page, theme, bundle }`, and pass both to the page object. A new fixture copies the fail-loud `?theme=`/`?bundle=` allowlist block from `demo/grid.html` (no hardcoded bundle `<script src=…>`). Formulas specs load HyperFormula as an external script in the fixture. Never-get-wrong list: `tests/AGENTS.md`.

## Which test

- **User-visible** (rendering, interaction, keyboard, menus, overlays) → E2E here.
- **Invisible to users** (data, indexing, algorithms) → Jest `*.unit.js`, still mandatory.
- **Public type surface** → a `*.types.ts` type test in the package whose types changed.
- **Pure refactor / internal non-runtime** → no new test; declare `Refactor-only: <reason>` in the commit.
- **New API / plugin / editor** → new spec. **Bug fix** → a failing case in the closest existing spec.
- **Broken or flaky legacy Jasmine** → migrate to Playwright.

Full decision rules: `handsontable/.ai/TESTING.md`.

## Test granular user actions

Handsontable implements the low-level interactions, so target fine-grained actions, not app-level happy paths:

- **Scrolling**: wheel, scrollbar drag, keyboard, momentum/inertial; frozen rows/cols and overlays aligned during and after.
- **Pointer**: hover (highlights, handles, tooltips), click/dblclick, context menu, drag-to-select, fill-handle drag, column/row resize and move.
- **Keyboard**: navigation, range selection, editing, shortcuts, enter/escape commit; IME composition for CJK.
- **Touch**: tap, long-press, touch scroll/drag on mobile viewports.
- **Layout**: RTL, container resize / ResizeObserver, viewport edges, large-dataset virtualization boundaries.

**Overlay-clone gotcha:** headers and frozen rows/cols render in several overlay layers (`.ht_clone_top`, `.ht_clone_inline_start`, the corner, plus the master), so a `data-testid` stamped in a renderer or header hook appears more than once. Scope the locator to the overlay (`page.locator('.ht_clone_top').getByTestId(...)`) or strict mode fails. Unfrozen cells live only in `.ht_master`.

Perform the action, then assert the exact cell / overlay / selection state. Judge a test by whether it would catch a real bug: `test-writing-discipline` skill.

## Recording

Record with the Playwright CLI (`npx playwright codegen`), the version-pinned tool installed here, not a Playwright MCP (an unpinned second automation surface, even when one is loaded in the session). Refactor the output into a page object with `data-testid` selectors before committing.

## References

- [`references/page-objects.md`](references/page-objects.md): POM, test ids, grid locators, editing, fixtures & the demo server.
- [`references/wrappers.md`](references/wrappers.md): React / Angular / Vue wrapper E2E.
- [`references/codegen.md`](references/codegen.md): recording via the CLI, `--ui`, trace viewer.
- [`references/determinism.md`](references/determinism.md): the flake-free checklist.

TypeScript style: `handsontable/.ai/CONVENTIONS.md`.
