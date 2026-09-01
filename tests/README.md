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
npm run test:e2e        # the e2e-main leg (plain UMD, main theme) — the same leg the local hooks run
npm run lint            # determinism + parse checks on the specs
```

The functional suite is six projects — theme (`main`/`horizon`/`classic`) ×
bundle (`umd` = `dist/handsontable.js`, `full-min` =
`dist/handsontable.full.min.js`), 1:1 with the Puppeteer matrix. The local
gates (pre-push, the Claude Stop hook, `test:e2e`) run `e2e-main` (plain UMD)
only; the `-min` legs run in CI. Run a single other leg by hand with
`npx playwright test --project=e2e-horizon-min`.

When enforcement requires a new test, you run it here to prove it works before you push — that is the point of a single, locally-runnable install.

### If the install seems missing

`Cannot find module '@playwright/test'` or an empty `tests/node_modules` means
the checkout's install predates this package joining the workspace, or was made
with `--filter`. The fix is always the same: `pnpm install` from the repo root
(`corepack enable` first if pnpm is not set up — the version is pinned by
`packageManager` in the root `package.json`). The static server also prints an
actionable warning at startup when the fixture-served HyperFormula is absent.

### The Puppeteer (legacy Jasmine) tier, locally

The frozen suite lives in the `handsontable` package and needs nothing beyond
the same one root `pnpm install` — the Chromium download runs via puppeteer's
allowed install script (`onlyBuiltDependencies` in `pnpm-workspace.yaml`):

```bash
npm --prefix handsontable run test:e2e         # full legacy suite (base bundle); scope with -- --testPathPattern=<name>
npm --prefix handsontable run test:production  # the same suite against handsontable.full.min.js
npm --prefix handsontable run test:walkontable # the rendering engine's own pipeline
```

## One Playwright version across the monorepo

There must be **one** Playwright version, installed once, aligned to the version CI runs — currently **1.61.1**. The mechanism is the pnpm **catalog**: `pnpm-workspace.yaml` declares `catalog: { '@playwright/test': 1.61.1 }` and this package sets `"@playwright/test": "catalog:"`. `visual-tests/` (and later `performance-tests/`, `docs/`) move onto the catalog in their own reviewed bumps.

The CI Playwright job runs inside the matching container image, `mcr.microsoft.com/playwright:v1.61.1-noble`, and installs with `pnpm install --filter handsontable-tests`. **The catalog version and the container tag bump together, never apart**, so local, CI, and baseline generation render identically.
