import { visualTest, expect, JS_VARIANTS } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';

type DemoKey = 'badge' | 'trial';

/**
 * The instant both keys are judged at: inside the fixture trial, which runs to 2026-09-26, and before the
 * badge key's renewal notice, which starts in 2027. It is `INSTANT.duringTrial` of
 * `tests/fixtures/pages/LicenseBrandingPage.ts`. The clock is fixed before the page loads, so what the
 * grid shows never depends on the day the suite runs.
 */
const DURING_TRIAL = new Date('2026-09-16T00:00:00Z');

/**
 * The theme each capture asks for on the bare run. The suite has no classic-theme variant: its `classic`
 * token is the run with no `HOT_THEME`, where the core draws the main theme. So on that run the spec
 * passes the demo's own `theme` param, which loads `ht-theme-classic.css`. The badge capture takes the
 * light classic theme and the trial capture the dark one, so the bare run covers both classic schemes
 * with no second declaration. On every other run the param stays `HOT_THEME`'s.
 */
const BARE_RUN_THEME: Record<DemoKey, string> = {
  badge: 'classic',
  trial: 'classic-dark',
};

/**
 * Builds the demo URL for one license key.
 *
 * @param {DemoKey} key The demo's `?key=`.
 * @returns {string}
 */
function demoUrl(key: DemoKey): string {
  const params: Record<string, string> = helpers.hotTheme ? { key } : { key, theme: BARE_RUN_THEME[key] };

  return helpers.setBaseUrl('/license-powered-by-demo').setPageParams(params).getFullUrl();
}

/**
 * Checks how the "Powered by Handsontable DataGrid" bar looks under the grid in every theme, light and
 * dark: its padding, type, colors and logomark (Figma 1424:19574). Capture 1 is a key with the `badge`
 * flag, which shows the bar alone; capture 2 is a running trial, which shows the bar beside the corner
 * badge in the corner header cell. On the bare run they show the classic theme, light and dark (see
 * `BARE_RUN_THEME`). When the bar shows, its link, its place last in the bottom slot, its geometry per
 * theme, its colors, the logomark's pixels, hover and the keyboard path are asserted in
 * `tests/e2e/license-branding.spec.ts`; what only pixels show is the bar's look in each theme. Owned by
 * DEV-3413.
 */
visualTest(__filename, {
  themes: JS_VARIANTS,
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  const poweredBy = tablePage.locator('.ht-license-powered-by');
  const badge = tablePage.locator('.ht-license-badge');

  await tablePage.clock.setFixedTime(DURING_TRIAL);

  // State 1: a `badge` key. The bar shows, and nothing else of the license UI does.
  await goto(demoUrl('badge'));

  await expect(poweredBy).toBeVisible();
  await expect(badge).toHaveCount(0);
  await expect(tablePage.locator('.hot-display-license-info')).toHaveCount(0);
  await expect(tablePage.locator('.ht-license-lock')).toHaveCount(0);
  await tablePage.screenshot({ path: helpers.screenshotPath() });

  // State 2: a running trial. The bar shows beside the corner badge, whose popover opens only on hover.
  await goto(demoUrl('trial'));

  await expect(poweredBy).toBeVisible();
  await expect(badge).toBeAttached();
  await expect(tablePage.locator('.ht-license-popover')).toBeHidden();
  await expect(tablePage.locator('.hot-display-license-info')).toHaveCount(0);
  await expect(tablePage.locator('.ht-license-lock')).toHaveCount(0);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
