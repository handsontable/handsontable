import { defineConfig, devices } from '@playwright/test';
import { withGuidepup } from '@guidepup/playwright';
import base from './playwright.config';

/**
 * The screen reader lanes: `screenreader/screenreader.spec.ts` drives a real screen reader through
 * Guidepup over the scenarios of `screenreader/scenarios/`, one Playwright project per screen reader
 * and browser, and writes a transcript per scenario (`tests/AGENTS.md`, "Screen readers: the NVDA
 * lane"). Report-only: a missing token group or a golden difference is a row in the job summary and a
 * neutral check run, never a red job.
 *
 * A separate config, the way the a11y and engines configs are: the base config's project list is
 * pinned by `e2e/leg-declarations.spec.ts` and `.github/scripts/__tests__/e2e-legs.test.mjs`, and the
 * leg-declaration sweep reads every spec under `e2e/`. The server, its port (`HOT_TEST_PORT`), the
 * base URL and the trace settings are inherited. `withGuidepup` pins one worker, no parallelism and
 * headed browsers: a screen reader is one per machine and reads what is on screen.
 *
 * The lane follows the platform: NVDA projects on Windows, VoiceOver projects on macOS (the VoiceOver
 * runner lands in the next pull request; the projects are named here so the goldens and the workflow
 * can be prepared). `HOT_SR_LANE=dom-echo` runs the scenarios on any platform against a reader that
 * echoes the focused element's accessible name and role, which proves the runner, the scenarios and
 * the report without a screen reader; it never runs in CI and records no golden anyone keeps.
 *
 * CI: `.github/workflows/screenreader.yml`, one job per browser on a Windows runner, started by
 * `screenreader-nightly.yml`. Locally on Windows: `npm --prefix tests run test:screenreader`, after
 * `npx @guidepup/setup install nvda` in `tests/` and the UMD build with the minified stylesheets.
 */
const LANES = {
  nvda: [
    { name: 'nvda-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'nvda-firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  voiceover: [
    { name: 'vo-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'vo-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  'dom-echo': [
    { name: 'dom-echo-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
} as const;

/**
 * The lane for this run: the explicit `HOT_SR_LANE`, otherwise the platform's screen reader.
 *
 * @returns {keyof typeof LANES} The lane.
 */
function resolveLane(): keyof typeof LANES {
  const requested = process.env.HOT_SR_LANE;

  if (requested !== undefined && requested !== '') {
    if (!(requested in LANES)) {
      throw new Error(`HOT_SR_LANE must be one of ${Object.keys(LANES).join(', ')}, received "${requested}".`);
    }

    return requested as keyof typeof LANES;
  }
  if (process.platform === 'win32') {
    return 'nvda';
  }
  if (process.platform === 'darwin') {
    return 'voiceover';
  }

  throw new Error('No screen reader lane for this platform: set HOT_SR_LANE=dom-echo to run the scenarios without one.');
}

const lane = resolveLane();
const config = defineConfig({
  ...base,
  testDir: 'screenreader',
  outputDir: 'test-results/screenreader',
  // A scenario starts the screen reader, enters the page and captures every step with a second of
  // silence after each: minutes, not seconds. Guidepup's own suite uses the same budget and retries.
  timeout: 300_000,
  retries: 2,
  // A scenario that passed on a retry is a transcript like any other: the attempt is in it.
  failOnFlakyTests: false,
  // No quarantine reporter: nothing is quarantined in a transcript, and it would fail a run that
  // completed no test for its own reason. No JSON reporter either: the artifact name stays outside the
  // `playwright-report-*` glob the flake ledger reads.
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { outputFolder: 'playwright-report/screenreader', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report/screenreader', open: 'never' }]],
  projects: LANES[lane].map(project => ({ ...project, testDir: 'screenreader' })),
});

// The dom-echo lane starts no screen reader, so it keeps the headless browser and the base config's
// parallelism is irrelevant (one spec, serial by `test.describe.configure` in the spec).
export default lane === 'dom-echo' ? config : withGuidepup(config);
