---
name: handsontable-playwright-e2e
description: Use when writing or modifying real-browser Playwright E2E / functional tests for Handsontable (specs in tests/e2e/, core, wrappers, or walkontable). Covers the Page Object Model, hooking in by data-testid, deterministic web-first waits, wrapper-specific gotchas, recording via the CLI, and the new-vs-modify / E2E-vs-unit decision. NOT for screenshot/visual tests (see visual-testing) or the legacy Jasmine suite (see handsontable-e2e-testing).
---

# Handsontable Playwright E2E authoring

New E2E is **Playwright** in `tests/e2e/` (`*.spec.ts`). The legacy Jasmine `*.spec.js` suite is frozen — never add a new one. Reference: `tests/e2e/grid.spec.ts` + `tests/fixtures/pages/GridPage.ts`.

## Four rules (non-negotiable)

1. **Page Object Model.** A spec expresses intent; selectors and interactions live in a page object under `tests/fixtures/pages/`. Never put raw selectors or multi-step flows in a spec — when the DOM shifts, one file changes.
2. **Hook by `data-testid`, not structural CSS.** Stamp ids in the fixture (or add them to the component when it removes ambiguity). Fall back to role/text locators before ever reaching into grid internals.
3. **Web-first waits only.** `await expect(locator).toBeVisible()` — never `sleep`/`waitForTimeout`/`networkidle` or a custom ready flag. Await *every* assertion (a missing await is the sneakiest flake).
4. **Isolation, no flake.** One instance per test; `page.route()` / `page.clock()` for network/time. `failOnFlakyTests` is on in CI — pass-on-retry is a hard failure.

## Which test — decide, then route

- **User-visible** (rendering, interaction, keyboard, menus, overlays) → **E2E here**.
- **Invisible to users** (data, indexing, algorithms) → **Jest `*.unit.js`** — still mandatory.
- **Pure refactor / non-runtime** → no new test; declare `Refactor-only: <reason>` in the commit.
- **New API / plugin / editor** → new spec. **Bug fix** → a failing case in the closest existing spec.
- **Broken or flaky legacy Jasmine → migrate to Playwright**, don't patch it.

Full decision rules: `handsontable/.ai/TESTING.md`.

## Recording

Record with the Playwright **CLI** (`npx playwright codegen`), **not** a Playwright MCP — the CLI is the version-pinned tool installed here (CI parity) and produces code you keep. Refactor the output into a page object with `data-testid` selectors before committing.

## References (load as needed)

- [`references/page-objects.md`](references/page-objects.md) — POM, test ids, grid locators, editing, fixtures & the demo server.
- [`references/wrappers.md`](references/wrappers.md) — React / Angular / Vue wrapper E2E: StrictMode, NgZone, reactivity, lifecycle, driving the example apps.
- [`references/codegen.md`](references/codegen.md) — recording via the CLI, `--ui`, trace viewer, refactoring the output.
- [`references/determinism.md`](references/determinism.md) — the flake-free checklist.

TypeScript style is not repeated here — Playwright specs follow the repo's TS conventions (`handsontable/.ai/CONVENTIONS.md`).
