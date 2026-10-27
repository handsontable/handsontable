# `tests/` — Playwright test package

The single Playwright package for Handsontable: functional end-to-end tests in `e2e/`, and visual regression in `visual/` (populated during the visual milestone). One config, one Playwright version.

> Distinct from `handsontable/test/` — that is the package-scoped Jasmine/Puppeteer + unit harness. This `tests/` directory is the Playwright package.

## Layout

```
tests/
├── playwright.config.ts   # one config; projects split e2e (flake-strict) from visual
├── playwright.a11y.config.ts # the axe scan's config: one project over a11y/, the e2e server inherited
├── playwright.a11y-checks.config.ts # the accessibility checks beyond axe: one project per check of EVIDENCE_CHECKS
├── playwright.screenreader.config.ts # the screen reader lane's config: one project per screen reader and browser, through Guidepup
├── e2e/                    # functional specs (*.spec.ts)
├── a11y/                   # the axe scan: axe.spec.ts, pages.mjs (the curated pages), axe-baseline.json; harness.ts (openers and guards shared with the checks beyond axe), evidence.ts; checks/ (the checks beyond axe, one spec each, and discovery-pages.mjs), tab-order-goldens/, tree-goldens/
├── screenreader/           # the screen reader lane: screenreader.spec.ts (the runner), scenarios/*.scenario.json, goldens/<project>/
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
npm run test:a11y       # the axe scan over the curated fixture pages, three themes (AGENTS.md, "A11y")
npm run test:screenreader # the scenarios through a real screen reader (NVDA on Windows); HOT_SR_LANE=dom-echo runs them without one (AGENTS.md, "Screen readers")
npm run lint            # determinism + parse checks on the specs
```

The fixtures load the built core: `dist/handsontable.js` (`full.min.js` for the `-min` legs) and
the **minified** stylesheets. On a fresh checkout run `npm --prefix handsontable run build`, or
minimally `build:umd`, `build:umd.min`, `build:styles.min`, and `build:themes-css.min`. The settings schema spec
(`settings-schema-umd.spec.ts`) also loads `dist/handsontable.settings-schema.js` (`.min.js` for the `-min` legs),
which `build:settings-schema-umd` and `build:settings-schema-umd.min` write. A missing
theme `.min.css` does **not** error — the grid renders unstyled (~20px rows) and specs fail in
misleading, geometry-dependent ways, so check the browser's network panel for 404s before
believing a strange local failure.

The suite serves on port `8123` and reuses a server that is already listening, so
running it from two checkouts at once makes the second one test the **first one's
build**, with no warning. Set `HOT_TEST_PORT` to give this checkout its own server:

```bash
HOT_TEST_PORT=8124 npm test
```

The functional suite is six projects — theme (`main`/`horizon`/`classic`) ×
bundle (`umd` = `dist/handsontable.js`, `full-min` =
`dist/handsontable.full.min.js`), the shape the Puppeteer matrix has on the E2E nightly. A spec runs on
`e2e-main` only unless its top-level blocks declare the axes it is sensitive
to with `THEMES_TAG` / `BUNDLES_TAG` (`AGENTS.md`, "Declaring the legs"); a
static sweep refuses a spec that touches theme or bundle surface without the
tag, and the E2E nightly runs every spec on all six legs (and the frozen Jasmine
suite on its six; a pull request runs that suite on UMD × main alone). The local gates
(pre-push, the Claude Stop hook, `test:e2e`) run `e2e-main` (plain UMD) only;
the other legs run in CI, where a long leg runs as several jobs
(`--shard=<i>/<n>` on the same project: `main` in 3, `horizon` and `classic` in
2, the `-min` legs whole) at a pinned worker count (`workers` in
`playwright.config.ts`, CI only; the engines config pins its own; a local run
keeps Playwright's default). To
run one shard the way a CI job does: `npx playwright test --project=e2e-main
--shard=1/3`. Run a single other leg by hand with
`npx playwright test --project=e2e-horizon-min` (it lists "No tests found" for a
spec that does not declare both axes), or every leg of one spec with
`HOT_E2E_FULL_MATRIX=1 npx playwright test e2e/<spec>.spec.ts`.

Tests tagged `@cross-browser` also run on Firefox and WebKit, through a separate
config with two projects (`e2e-firefox`, `e2e-webkit`) that CI runs in its own job.
Locally, install the two engines once and name the config:
`npx playwright install firefox webkit`, then
`npx playwright test --config playwright-engines.config.ts e2e/<spec>.spec.ts`.
See `AGENTS.md`, "The engine legs".

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

In CI a pull request runs `test:e2e` on the main theme only (`E2E / UMD (theme: main)`); the
six legs — three themes, `test:e2e` and `test:production` — run on the E2E nightly, the
rc/stable publish path and a master push (`.ai/CI.md`, the Jasmine single-leg entry).

## The accessibility scan, locally

`npm run test:a11y` runs axe-core over the pages of `a11y/pages.mjs` on the three themes and
compares the findings with `a11y/axe-baseline.json`; the HTML report (`a11y-report.html`), the
agent findings (`a11y-findings.json`), the summary and the comparison land in `test-results/a11y/`. It needs the same build as the e2e tier, and the minified theme
stylesheets in particular: an unstyled grid gives wrong contrast results without an error. A
finding outside the baseline is reported, never a red run (warn mode); what fails is a page that
does not load or a baseline that does not validate. How to add a page or baseline a finding:
`AGENTS.md`, "A11y: the axe scan and its baseline".

## The screen reader lane, locally

`npm run test:screenreader` runs the scenarios of `screenreader/scenarios/` against a real screen reader
through Guidepup: NVDA on Windows (`npx -y @guidepup/setup@0.29.3 install nvda` in this directory once,
after the install; the setup CLI is never a dependency, because its optional recording helper depends on a
GPL-licensed ffmpeg build). macOS has no default lane yet: the config throws unless `HOT_SR_LANE` is set,
because the VoiceOver runner lands in the next pull request, and `HOT_SR_LANE=dom-echo` runs the scenarios
without a screen reader. It needs the same build as the e2e tier. A missing token group or a golden
difference is reported, never a red run (report mode); what fails is a fixture that does not load, a step
that never reaches its state, or a screen reader that does not start. The transcripts land in
`test-results/screenreader/transcripts/`, and `npm run screenreader:report` is a dry run: it writes
`test-results/screenreader/summary.md` and prints the check-run payload CI would post. Without a screen
reader, `HOT_SR_LANE=dom-echo npm run test:screenreader` runs the same scenarios against the focused element
in headless Chromium, which checks the fixture, the keys, the `after` states and the report before the
Windows job does; its wording rows are not evidence, because it always announces the focused element. Goldens are
recorded by the nightly's `update-goldens` dispatch, not locally. The rules: `AGENTS.md`, "Screen readers:
the NVDA lane".

## One Playwright version across the monorepo

There must be **one** Playwright version, installed once, aligned to the version CI runs — currently **1.62.1**. The mechanism is the pnpm **catalog**: `pnpm-workspace.yaml` declares `catalog: { '@playwright/test': 1.62.1 }` and this package, `visual-tests/`, and `docs/` all set `"@playwright/test": "catalog:"`. `performance-tests/` is npm-managed (its own `package-lock.json`), so its pin is bumped by hand in lockstep.

The CI Playwright job runs inside the matching container image, `mcr.microsoft.com/playwright:v1.62.1-noble`, and installs with `pnpm install --filter handsontable-tests`. **The catalog version and the container tag bump together, never apart**, so local, CI, and baseline generation render identically.
