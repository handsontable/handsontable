---
name: handsontable-playwright-e2e
description: Use when writing or modifying real-browser Playwright E2E / functional tests for Handsontable (specs in tests/e2e/, core, wrappers, or walkontable). Covers the Page Object Model, hooking in by data-testid, deterministic web-first waits, wrapper-specific gotchas, recording via the CLI, and the new-vs-modify / E2E-vs-unit decision. NOT for screenshot/visual tests (see visual-testing) or the legacy Jasmine suite (see handsontable-e2e-testing).
---

# Handsontable Playwright E2E authoring

New E2E is **Playwright** in `tests/e2e/` (`*.spec.ts`). The legacy Jasmine `*.spec.js` suite is frozen — never add a new one. Reference: `tests/e2e/grid.spec.ts` + `tests/fixtures/pages/GridPage.ts`.

## Where tests RUN (scope discipline)

Locally, run **only the specs you created or changed** — never the full suite,
and under the **default theme** only (fast smoke):
`cd tests && npx playwright test --project=e2e-main e2e/<your-spec>.spec.ts`.
The Stop hook and pre-push do exactly this automatically (session-touched /
branch-touched specs). Every spec is parametrized across a **theme
(main/horizon/classic) × bundle (`umd` = `handsontable.js`, `full-min` =
`handsontable.full.min.js`) matrix** — six projects, 1:1 with the Puppeteer
legs; the full matrix belongs to CI (one `E2E / Playwright <bundle>
(theme: …)` job per leg). The local gates run `e2e-main` (plain UMD) only —
the `-min` legs are CI-only. To run all legs locally for one spec, drop the
`--project` filter: `npx playwright test e2e/<your-spec>.spec.ts`. `npm test`
in `tests/` (the whole suite × all themes) locally = wasted minutes, never
required evidence.

### Check port 8123 before you believe a local result

The `webServer` config uses `reuseExistingServer`, so Playwright attaches to
**whatever already listens on port 8123** instead of starting its own. A second
checkout — a worktree beside the main clone, or another session's leftover
`support/static-server.mjs` — therefore serves *its* `handsontable/dist/`, and
your specs silently exercise a build you did not make. Nothing in the output says
so: the run just passes, or fails for reasons your diff cannot explain.

Check first, every time you run locally:

```bash
lsof -nP -i :8123 | grep LISTEN     # empty = free, safe to run
```

If something is listening and it is not yours, do not kill it — another session
may be mid-run. Give your run its own port instead:

```bash
cd tests && HOT_TEST_PORT=8131 npx playwright test --project=e2e-main e2e/<your-spec>.spec.ts
```

`HOT_TEST_PORT` is read by `tests/playwright.config.ts` and passed explicitly to
both the server and the base URL. It throws on a malformed or empty value rather
than falling back to 8123 — the collision it exists to escape. This knob is the
**functional suite only**; the visual suite's port is owned by
`visual-tests/src/config.mjs` plus two hardcoded `app.listen(8082)` demo servers,
so it cannot be moved this way.

## Four rules (non-negotiable)

1. **Page Object Model.** A spec expresses intent; selectors and interactions live in a page object under `tests/fixtures/pages/`. Never put raw selectors or multi-step flows in a spec — when the DOM shifts, one file changes.
2. **Hook by `data-testid`, not structural CSS.** Stamp ids in the fixture (or add them to the component when it removes ambiguity). Fall back to role/text locators before ever reaching into grid internals.
3. **Web-first waits only.** `await expect(locator).toBeVisible()` — never `sleep`/`waitForTimeout`/`networkidle` or a custom ready flag. Await *every* assertion (a missing await is the sneakiest flake). Inside a page object the same rule has six shapes lint cannot see — `setTimeout` in `page.evaluate()`, a `waitForFunction` without `{ polling }`, a scroll method that ends on `scrollTop`, `.at(-1)` on a separately read log, a fixture build that fails silently, a negative settle with no positive control — each measured on a migration and spelled out in `references/determinism.md`.
4. **Isolation, no flake.** One instance per test; `page.route()` / `page.clock()` for network/time. `failOnFlakyTests` is on in CI — pass-on-retry is a hard failure.
5. **Thread the bundle axis.** Import `test` from `tests/fixtures/test.ts`, destructure `{ page, theme, bundle }`, and pass both to the page object. A new fixture copies the fail-loud `?theme=`/`?bundle=` allowlist block from `demo/grid.html` — never a hardcoded bundle `<script src=…>`. Formulas specs load HyperFormula as an external script in the fixture (the `umd` legs' base bundle ships none). The never-get-wrong list: `tests/AGENTS.md`.

## Which test — decide, then route

- **User-visible** (rendering, interaction, keyboard, menus, overlays) → **E2E here**.
- **Invisible to users** (data, indexing, algorithms) → **Jest `*.unit.js`** — still mandatory.
- **Pure refactor / non-runtime** → no new test; declare `Refactor-only: <reason>` in the commit.
- **New API / plugin / editor** → new spec. **Bug fix** → a failing case in the closest existing spec.
- **Broken or flaky legacy Jasmine → migrate to Playwright**, don't patch it.

Full decision rules: `handsontable/.ai/TESTING.md`.

## Test granular user actions — HOT is a library, not an app

Handsontable *implements* the low-level interactions; you cannot assume the layer
beneath "just works" the way you would when testing an app built on a framework.
Scenario generation must target **fine-grained user actions and their correctness**,
not app-level happy paths:

- **Scrolling** — wheel, drag-the-scrollbar, keyboard, and **momentum / inertial**
  scroll; frozen rows/cols and overlays staying aligned *during and after* the scroll.
- **Pointer** — hover (highlights, handles, tooltips), click / dblclick, context menu,
  drag-to-select, the **fill-handle** drag, column/row **resize** and **move** drags.
- **Keyboard** — navigation, range selection, editing, shortcuts, enter/escape commit
  semantics; **IME** composition for CJK input.
- **Touch** — tap, long-press, touch scroll/drag on mobile viewports.
- **Layout** — RTL, container resize / ResizeObserver, viewport edges, large-dataset
  virtualization boundaries.

**Overlay-clone gotcha (hooking):** column/row headers and frozen rows/cols are
rendered in *multiple* overlay layers (`.ht_clone_top`, `.ht_clone_inline_start`, the
corner, plus the master), so a `data-testid` stamped in a renderer or a header hook
appears **more than once** in the DOM. Scope the locator to the overlay you mean
(e.g. `page.locator('.ht_clone_top').getByTestId(...)`) or the strict-mode match
fails. Plain (unfrozen) cells live only in `.ht_master`, so they hook cleanly.

Prefer a driven, observable check (perform the action, then assert the exact cell /
overlay / selection state) over "it rendered". A scenario like *momentum scroll keeps
the frozen top overlay aligned* is the right altitude — the class of bug only a
real-browser, low-level test catches. **Fewer such tests, each extremely meaningful,
beats many shallow ones** — judge a test by whether it would catch a real bug, not by
what it executes. Full discipline: the `test-writing-discipline` skill.

## Recording

Record with the Playwright **CLI** (`npx playwright codegen`), **not** a Playwright MCP — the CLI is the version-pinned tool installed here (CI parity) and produces code you keep. Refactor the output into a page object with `data-testid` selectors before committing.

## References (load as needed)

- [`references/page-objects.md`](references/page-objects.md) — POM, test ids, grid locators, editing, fixtures & the demo server.
- [`references/wrappers.md`](references/wrappers.md) — React / Angular / Vue wrapper E2E: StrictMode, NgZone, reactivity, lifecycle, driving the example apps.
- [`references/codegen.md`](references/codegen.md) — recording via the CLI, `--ui`, trace viewer, refactoring the output.
- [`references/determinism.md`](references/determinism.md) — the flake-free checklist.

TypeScript style is not repeated here — Playwright specs follow the repo's TS conventions (`handsontable/.ai/CONVENTIONS.md`).
