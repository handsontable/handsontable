# `tests/` — Playwright test package

The single Playwright package for Handsontable: functional end-to-end tests in `e2e/`, and visual regression in `visual/` (populated during the visual milestone). One config, one Playwright version.

> Distinct from `handsontable/test/` — that is the package-scoped Jasmine/Puppeteer + unit harness. This `tests/` directory is the Playwright package.

## Layout

```
tests/
├── playwright.config.ts   # one config; projects split e2e (flake-strict) from visual
├── e2e/                    # functional specs (*.spec.ts)
├── visual/                 # visual regression — destination for the current visual-tests/ suite
├── fixtures/
│   ├── demo/               # static pages that mount a real grid for tests to drive
│   └── pages/              # Page Objects — selectors + interactions live here, not in specs
└── support/                # static file server for the fixtures
```

## Conventions (enforced by the `handsontable-playwright-e2e` skill)

- **Page Object Model.** Specs express intent (`grid.editCell(0, 0, 'x')`); selectors and interaction mechanics live in `fixtures/pages/`. When the DOM shifts, one file changes.
- **Address elements by `data-testid`.** The demo fixtures stamp stable test ids (e.g. `cell-<row>-<col>`) so tests hook in unambiguously instead of via brittle structural CSS.
- **Web-first waits only.** `await expect(locator).toBeVisible()` and friends — never `waitForTimeout`/`sleep`, never a custom readiness global. `npm run lint` enforces this: `tests/.eslintrc.cjs` bans `page.waitForTimeout()`, `sleep()`, and `'networkidle'` at `error`. (The richer `eslint-plugin-playwright` ruleset is the recommended upgrade, but it is a new third-party dependency gated on the minimal-dependency team discussion — until then the hand-rolled `no-restricted-syntax` bans cover the determinism anti-patterns.)
- **Deterministic.** `failOnFlakyTests` in CI; a test that only passes on retry is a hard failure.

## Running locally

This package is a **pnpm workspace member** — never install it with npm (the
monorepo is pnpm-managed; that mismatch is exactly what broke the CI install).

```bash
pnpm install            # from the repo root — installs the whole workspace, tests/ included
npx playwright install  # browsers, once per version (CI runs inside the pinned container instead)
cd tests
npm test                # all projects (package scripts work as usual once installed)
npm run test:e2e        # just the functional e2e project
npm run lint            # determinism + parse checks on the specs
```

When enforcement requires a new test, you run it here to prove it works before you push — that is the point of a single, locally-runnable install.

## One Playwright version across the monorepo

There must be **one** Playwright version, installed once, aligned to the version CI runs — currently **1.61.1**. The mechanism is the pnpm **catalog**: `pnpm-workspace.yaml` declares `catalog: { '@playwright/test': 1.61.1 }` and this package sets `"@playwright/test": "catalog:"`. `visual-tests/` (and later `performance-tests/`, `docs/`) move onto the catalog in their own reviewed bumps.

The CI Playwright job runs inside the matching container image, `mcr.microsoft.com/playwright:v1.61.1-noble`, and installs with `pnpm install --filter handsontable-tests`. **The catalog version and the container tag bump together, never apart**, so local, CI, and baseline generation render identically.
