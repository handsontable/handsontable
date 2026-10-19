import { defineConfig, devices } from '@playwright/test';
import type { TestOptions } from './fixtures/test';
import { FULL_MATRIX_ENV, legGrep, parseFullMatrix } from './lib/leg-declarations.mjs';

// `reuseExistingServer` attaches to whatever already listens on this port. Two
// checkouts (a worktree and the main clone) on the default port therefore share
// ONE server, and the second one silently tests the first one's build. Set
// `HOT_TEST_PORT` to run them side by side.
//
// Namespaced on purpose. `PORT` is a conventional name that shells and tools
// already export for unrelated reasons, and this config would otherwise retarget
// itself for anyone who happens to have it set. The port is passed explicitly to
// the server below, so the two always agree whatever the ambient environment says.
// Throwing beats defaulting here: `HOT_TEST_PORT=8124x` and an empty value both
// coerce to a falsy number, so a silent fallback would put the run back on the
// shared port — the exact collision the variable was set to escape — while the
// developer believes it moved.
const PORT = resolvePort();

// `HOT_E2E_FULL_MATRIX=1` runs every spec on every project (the nightly, the rc/stable path, a
// master push); unset, '' and '0' run the shape each spec declares; anything else throws, the
// resolvePort() precedent: a typo must not quietly turn the night meant to run everything into the
// reduced run.
const FULL_MATRIX = parseFullMatrix(process.env[FULL_MATRIX_ENV]);

/**
 * Resolves the server port from `HOT_TEST_PORT`, defaulting to 8123.
 *
 * Port 0 is rejected rather than treated as "any free port". Nothing below this
 * function supports it: `support/static-server.mjs` reads `Number(PORT) || 8123`,
 * and `Number('0')` is falsy, so the server would bind 8123 and land straight back
 * on the shared port; `baseURL` would render `http://localhost:0`; and Playwright
 * only waits for the server when `port` is truthy, so it would not be waited for
 * at all. A real dynamic port needs the server to report the port it bound, which
 * is listed under "Known gaps" in `.ai/WORKTREES.md`.
 *
 * @returns {number} A valid TCP port between 1 and 65535.
 */
function resolvePort(): number {
  const raw = process.env.HOT_TEST_PORT;

  if (raw === undefined || raw === '') {
    return 8123;
  }

  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`HOT_TEST_PORT must be an integer between 1 and 65535, received "${raw}".`);
  }

  return port;
}

/**
 * One Playwright config for the whole package. Functional E2E lives in `e2e/`,
 * visual regression in `visual/` (populated during the visual milestone). The
 * two are separated by projects so each can carry its own settings — e2e is
 * flake-strict, visual will add screenshot tolerances and masks.
 *
 * Matrix coverage: the functional suite has the shape the Puppeteer e2e
 * matrix has on the full-matrix runs — theme (main/horizon/classic) × bundle
 * (`umd` = dist/handsontable.js, `full-min` = dist/handsontable.full.min.js) —
 * one project per combination, loading the exact files the Puppeteer
 * `test:e2e` and `test:production` legs load (a pull request runs that suite
 * on `main` × UMD alone). Which specs a project runs is DECLARED per spec, with a tag on every
 * top-level block (`lib/leg-declarations.mjs`; tests/AGENTS.md, "Declaring
 * the legs"): `e2e-main` runs every spec, `e2e-horizon` and `e2e-classic` run
 * the specs tagged THEMES_TAG, `e2e-main-min` the specs tagged BUNDLES_TAG,
 * and `e2e-horizon-min`/`e2e-classic-min` those tagged both — each project's
 * own `grep` below, never a top-level one, so the engines config that spreads
 * this one keeps its own filter. `HOT_E2E_FULL_MATRIX=1` (the nightly, the
 * rc/stable path, a master push) drops the greps and runs every spec on every
 * project. CI runs one job per leg and shard (an explicit matrix of
 * `--project=e2e-<theme>[-min]` rows, a long leg cut with `--shard=<i>/<n>`
 * at the `workers` count pinned below); locally, `npx playwright test` runs the
 * declared shape, and `--project=e2e-horizon` on an undeclared spec says "No
 * tests found" by design (no `--pass-with-no-tests`: an empty leg is a red
 * job, never a green one that ran nothing; an empty shard, which Playwright
 * lets pass, is failed by the quarantine reporter). The bundles Puppeteer does not
 * test either (handsontable.full.js, handsontable.min.js) are deliberately
 * NOT here, and not on the nightly either.
 *
 * Version parity rule: `@playwright/test` here and the CI container image
 * (`mcr.microsoft.com/playwright:v<same>-noble`) bump together, never apart, so
 * local, CI, and baseline generation render identically.
 */
const E2E_THEMES = ['main', 'horizon', 'classic'] as const;
// The Puppeteer bundle pair: UMD (dist/handsontable.js, `test:e2e`) and
// UMD.min (dist/handsontable.full.min.js, `test:production`), which a pull
// request runs on UMD alone and the nightly on both. The
// un-suffixed projects run the plain UMD so existing local commands and hooks
// (`--project=e2e-main`) keep working. That also means every LOCAL gate
// (pre-push, the Claude Stop hook, `npm run test:e2e` — all pinned to
// e2e-main) covers the plain UMD only; the `-min` legs are CI-only. This
// flipped with the bundle axis: `e2e-main` used to load the full.min bundle.
const E2E_BUNDLES = [
  { bundle: 'umd', suffix: '' },
  { bundle: 'full-min', suffix: '-min' },
] as const;

export default defineConfig<TestOptions>({
  testDir: '.',
  timeout: 20_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // CI pins the worker count; a local run keeps Playwright's default (half the
  // cores). Playwright's default on the 4-vCPU standard runner is 2, and the
  // suite is one Chromium per worker against a static server, so it has room:
  // measured on the main leg in one run (38755690783, the same build, the same
  // 3,377 tests, `nproc` 4), 2 workers took 16.9 min and 4 took 11.9 (1.42×;
  // the summed per-test time grew 32.8 → 45.9 min, the contention), both runs
  // clean, with a container peak of 4.8 GiB of the 16 GiB at 4 workers (3.2 at
  // 2) and no swap. The shard counts in e2e.yml's matrix were derived at this
  // count, and .github/scripts/__tests__/e2e-legs.test.mjs pins the line. The
  // engines config (Firefox, WebKit) does not inherit it: it pins 2.
  workers: process.env.CI ? 4 : undefined,
  // The next three CI values are pinned by
  // .github/scripts/__tests__/playwright-flake-settings.test.mjs — the flake
  // ledger depends on them (tests/AGENTS.md, "Where a flake goes").
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A test that only passes on retry is a hard failure pre-merge.
  failOnFlakyTests: !!process.env.CI,
  // CI: html (open:never) — it is what the failure-artifact upload collects
  // (tests/playwright-report) — plus GitHub annotations, plus the JSON report
  // the cross-run flake ledger reads (`.github/workflows/test-health.yml`; the
  // path is pinned by `.github/scripts/lib/test-health.mjs` and asserted in its
  // tests). No `blob` reporter: a sharded leg (e2e.yml, `--shard`) keeps this
  // list per shard, so each shard's job decides its own exit status through the
  // quarantine reporter and uploads its own report and durations part, and the
  // test-health collector folds the parts by artifact name.
  // The quarantine reporter (`reporters/quarantine.ts`) runs last and sets the
  // exit status: a flaky test under a live quarantine reports without failing
  // the run, an expired or over-cap quarantine fails it. See tests/AGENTS.md.
  // `list` first restores the terminal progress the quarantine reporter's `printsToStdio` would
  // otherwise suppress; the quarantine reporter stays LAST, because the multiplexer keeps the
  // status of the last reporter that returns one and that is what downgrades a quarantined flake.
  reporter: process.env.CI
    ? [
      ['list'],
      ['html', { open: 'never' }],
      ['github'],
      ['json', { outputFile: 'test-results/report.json' }],
      ['./reporters/quarantine.ts'],
    ]
    : [['list'], ['html'], ['./reporters/quarantine.ts']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  // Serves the repo root so the fixture page can load the built handsontable
  // dist and styles. cwd defaults to this config's directory (`tests/`).
  webServer: {
    command: 'node support/static-server.mjs',
    port: PORT,
    // static-server.mjs reads PORT. Passing it explicitly keeps the server and
    // the config on the same port even when the surrounding shell exports its own.
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    // One functional project per theme × bundle leg — the destination for any
    // new e2e spec. The `theme` and `bundle` options flow to the page objects,
    // which load the matching theme stylesheet and Handsontable bundle in the
    // fixture.
    ...E2E_BUNDLES.flatMap(({ bundle, suffix }) => E2E_THEMES.map(theme => ({
      name: `e2e-${theme}${suffix}`,
      testDir: 'e2e',
      grep: legGrep({ theme, bundle, fullMatrix: FULL_MATRIX }),
      use: { ...devices['Desktop Chrome'], theme, bundle },
    }))),
    // Visual regression project — destination for the visual suite (milestone 2/3).
    // {
    //   name: 'visual-chromium',
    //   testDir: 'visual',
    //   use: { ...devices['Desktop Chrome'] },
    //   expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
    // },
  ],
});
