import { defineConfig, devices } from '@playwright/test';
import type { TestOptions } from './fixtures/test';

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

/**
 * Resolves the server port from `HOT_TEST_PORT`, defaulting to 8123.
 *
 * @returns {number} A valid TCP port. 0 is allowed: it asks for any free port,
 *   which is the safest choice when several checkouts run at once.
 */
function resolvePort(): number {
  const raw = process.env.HOT_TEST_PORT;

  if (raw === undefined || raw === '') {
    return 8123;
  }

  const port = Number(raw);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`HOT_TEST_PORT must be an integer between 0 and 65535, received "${raw}".`);
  }

  return port;
}

/**
 * One Playwright config for the whole package. Functional E2E lives in `e2e/`,
 * visual regression in `visual/` (populated during the visual milestone). The
 * two are separated by projects so each can carry its own settings — e2e is
 * flake-strict, visual will add screenshot tolerances and masks.
 *
 * Matrix coverage: the functional suite mirrors the Puppeteer e2e matrix
 * 1:1 — theme (main/horizon/classic) × bundle (`umd` = dist/handsontable.js,
 * `full-min` = dist/handsontable.full.min.js) — one project per combination,
 * loading the exact files the Puppeteer `test:e2e` and `test:production` legs
 * load. Every spec is parametrized automatically — authors write one spec and
 * it runs under all legs. CI runs one job per leg (a `theme × bundle` matrix
 * over `--project=e2e-<theme>[-min]`); locally, `npx playwright test` runs
 * all legs and `--project=e2e-horizon` runs one. The bundles Puppeteer does
 * not test either (handsontable.full.js, handsontable.min.js) are deliberately
 * NOT here — extra coverage belongs to the nightly on develop (DEV-2058).
 *
 * Version parity rule: `@playwright/test` here and the CI container image
 * (`mcr.microsoft.com/playwright:v<same>-noble`) bump together, never apart, so
 * local, CI, and baseline generation render identically.
 */
const E2E_THEMES = ['main', 'horizon', 'classic'] as const;
// 1:1 with the Puppeteer bundle legs: UMD (dist/handsontable.js, `test:e2e`)
// and UMD.min (dist/handsontable.full.min.js, `test:production`). The
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
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A test that only passes on retry is a hard failure pre-merge.
  failOnFlakyTests: !!process.env.CI,
  // CI: html (open:never) — it is what the failure-artifact upload collects
  // (tests/playwright-report) — plus GitHub annotations. Blob is only for
  // sharded runs, which this suite does not use.
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
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
