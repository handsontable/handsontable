import { test, expect } from '@playwright/test';

/**
 * Regression test for DEV-1263.
 *
 * On initial page load, docs examples mount inside a zero-size loading shimmer.
 * Once the shimmer is removed the grid must re-read its dimensions and render.
 * The example-runner previously forced this render after a fixed setTimeout(100),
 * which raced against autoRowSize height sampling (several requestAnimationFrame
 * cycles). When the forced render fired mid-sampling the grid computed 0 rows and
 * stayed visually broken until the user scrolled or clicked.
 *
 * These tests assert that every framework's demo grid renders its data on initial
 * load WITHOUT any interaction. CPU throttling is applied to widen the timing
 * window so the old race reliably surfaces; the assertions never click or scroll,
 * so a stuck-broken grid cannot "self-heal" before the check.
 */

// The first data row of the getting-started demo (shared across all frameworks).
const FIRST_CELL_TEXT = 'Tagcat';

const demoPages = [
  { prefix: 'js', path: '/javascript-data-grid/demo' },
  { prefix: 'react', path: '/react-data-grid/demo' },
  { prefix: 'angular', path: '/angular-data-grid/demo' },
  { prefix: 'vue', path: '/vue-data-grid/demo' },
];

test.beforeEach(async({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');
  const extractedDomain = url.hostname;

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: extractedDomain,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ? process.env.PASS_COOKIE : '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
});

demoPages.forEach(({ prefix, path }) => {
  test(`${prefix} demo renders data on initial load without interaction`, async({ page, baseURL }) => {
    // Throttle the CPU so autoRowSize sampling outlasts the legacy 100ms timer,
    // reproducing the conditions under which the initial render previously broke.
    const client = await page.context().newCDPSession(page);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

    await page.goto(`${baseURL}${path}`);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);

    // The master table holds the rendered data cells. A broken initial render
    // produces 0 data rows, so the first cell never receives its value.
    const firstDataCell = page
      .locator('.ht_master .htCore tbody tr')
      .first()
      .locator('td')
      .first();

    // No click or scroll happens before this assertion: it passes only if the
    // grid settled into a correct render on its own.
    await expect(firstDataCell).toHaveText(FIRST_CELL_TEXT);

    // Guard against a partially-collapsed render: several data rows must exist.
    const renderedRows = page.locator('.ht_master .htCore tbody tr');

    expect(await renderedRows.count()).toBeGreaterThan(5);
  });
});
