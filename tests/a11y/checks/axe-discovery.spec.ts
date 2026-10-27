import { readFileSync } from 'node:fs';
import { test, expect, devices, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y_PAGES, fixtureUrl, type A11yPage, type A11yState } from '../pages.mjs';
import { PORTAL, STATES, emulate, highlightMenuItem, markPortal, openTarget, releaseParkedFetches, selectCell, type RootWrapper } from '../harness';
import { attachEvidence, declareTarget, readEnvironment } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import { DISCOVERY_TAGS, discoveryFindings } from '../../lib/axe-discovery.mjs';
import { DISCOVERY_PAGES } from './discovery-pages.mjs';
import { installDarkScheme } from './variants';

/**
 * The axe discovery run: axe with the best-practice, AAA and experimental rules beside the WCAG 2.2 A
 * and AA ones (`DISCOVERY_TAGS`), over the catalog, the states of `discovery-pages.mjs`, every page in
 * the dark scheme and right to left, and the phone page on a Pixel 7 beside the iPhone. It never reads
 * or writes the baseline (`../axe-baseline.json`) and never posts to the `A11y / axe report` check run:
 * its records are for triage (`lib/axe-discovery.mjs`), every "needs review" result listed with axe's
 * reason, and its check run is `A11y / axe-discovery report`. Nightly only.
 *
 * - **Dark** (every theme): a script installed before the fixture loads turns every `ht-theme-<name>`
 *   class the page or the grid writes into `ht-theme-<name>-dark`, the way `?scheme=dark` does on the
 *   three fixtures that take it, so the grid and its portal are built dark from the start.
 * - **Right to left** (the main theme): the fixture is served with `dir="rtl"` on its `<html>`, so a grid
 *   that inherits its layout direction is built right to left. A fixture that pins its direction stays
 *   left to right, and the record says the variant did not apply.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

type DiscoveryState = A11yState | 'focused-cell' | 'header-button-hover' | 'filter-option-focused' | 'multi-range'
  | 'context-menu-submenu-2' | 'sheets-bar-rename' | 'dialog-focused';
type DiscoveryPage = Omit<A11yPage, 'state'> & { state: DiscoveryState };

const hotOf = (selector: string) => `(document.querySelector(${JSON.stringify(selector)})?.querySelector('.ht-root-wrapper'))?.__hotInstance`;

/**
 * The states only the discovery run scans; the catalog's are the harness's `STATES`.
 */
const DISCOVERY_STATES: Record<string, (page: Page, entry: DiscoveryPage, root: string, cell: [number, number]) => Promise<void>> = {
  // The focus ring a keyboard user sees: the selection moved with an arrow key.
  'focused-cell': async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`${root} .ht_master td.current`)).toBeFocused();
  },
  'header-button-hover': async(page, _entry, root, [, col]) => {
    const button = page.locator(`${root} .ht_clone_top .changeType`).nth(col);

    await button.hover();
    await expect(button).toBeVisible();
  },
  // The value list is no tab stop of its own: Tab reaches the search field, and ArrowDown moves into the list.
  'filter-option-focused': async(page, entry, root, cell) => {
    await STATES['dropdown-menu'](page, entry as A11yPage, root, cell);

    for (let press = 0; press < 12; press++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => !!document.activeElement?.closest('.htUIMultipleSelectSearch'))) {
        break;
      }
    }
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.htUIMultipleSelectHot')),
      { message: 'ArrowDown from the search field moved the focus into the filter value list' }).toBe(true);
  },
  'multi-range': async(page, _entry, root) => {
    const selected = await page.evaluate(`${hotOf(root)}.selectCells([[1, 1, 2, 2], [4, 3, 6, 4]])`);

    expect(selected, 'two ranges selected').toBe(true);
  },
  'context-menu-submenu-2': async(page, entry, root, cell) => {
    await STATES['context-menu'](page, entry as A11yPage, root, cell);
    await highlightMenuItem(page, '.htContextMenu', 'Level one');

    // A submenu opens toward the inline end: ArrowLeft in a right-to-left grid.
    const inward = await page.evaluate(`${hotOf(root)}.isRtl()`) ? 'ArrowLeft' : 'ArrowRight';

    await page.keyboard.press(inward);
    await expect(page.locator('.htContextMenu:visible')).toHaveCount(2);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(inward);
    await expect(page.locator('.htContextMenu:visible')).toHaveCount(3);
  },
  'sheets-bar-rename': async(page, _entry, root) => {
    await page.locator(`${root} .ht-sheets-bar__tab-label`).first().dblclick();
    await expect(page.locator(`${root} .ht-sheets-bar__tab-rename`)).toBeFocused();
  },
  'dialog-focused': async(page, _entry, root) => {
    await page.evaluate(`(() => { const hot = ${hotOf(root)}; hot.listen(); hot.getPlugin('dialog').focus(); })()`);
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('.ht-dialog') !== null),
      { message: 'the focus is inside the dialog' }).toBe(true);
  },
};

/**
 * Serves the fixture with `dir="rtl"` on its `<html>`.
 *
 * @param page The page.
 * @param fixture The fixture's file name.
 */
async function installRightToLeft(page: Page, fixture: string): Promise<void> {
  await page.route(url => url.pathname.endsWith(`/fixtures/demo/${fixture}`), async(route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/<html(\s|>)/i, '<html dir="rtl"$1');

    await route.fulfill({ response, body });
  });
}

/**
 * The query a fixture takes to build its grid right to left, read from its source: most fixtures pick
 * `?dir=`, the sheets bar and freeze bar fixtures read `?rtl=1`, the phone fixture `?direction=`. A
 * fixture that reads none of them inherits the direction from the `dir` the variant writes on `<html>`.
 *
 * @param fixture The fixture's file name.
 * @returns The query to append, or an empty string.
 */
function rtlQuery(fixture: string): string {
  const source = readFileSync(new URL(`../../fixtures/demo/${fixture}`, import.meta.url), 'utf8');

  if (/htPick\('dir'|get\('dir'\)/.test(source)) {
    return '&dir=rtl';
  }
  if (/get\('direction'\)/.test(source)) {
    return '&direction=rtl';
  }
  if (/flag\('rtl'|get\('rtl'\)/.test(source)) {
    return '&rtl=1';
  }

  return '';
}

/**
 * Scans one page in one theme and variant.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The page.
 * @param theme The theme.
 * @param variant The variant, or none.
 */
async function discover(page: Page, testInfo: TestInfo, entry: DiscoveryPage, theme: string, variant: string | null): Promise<void> {
  const startedAt = Date.now();
  const url = `${fixtureUrl(entry, theme)}${variant === 'rtl' ? rtlQuery(entry.fixture) : ''}`;
  const target = { page: entry.id, theme, state: entry.state, variant, url };

  declareTarget(testInfo, target);
  if (variant === 'dark') {
    await installDarkScheme(page);
  } else if (variant === 'rtl') {
    await installRightToLeft(page, entry.fixture);
  }

  const opened = await openTarget(page, entry as A11yPage, theme, { url });
  const { root, cell } = opened;
  const opener = DISCOVERY_STATES[entry.state] ?? STATES[entry.state as A11yState];

  await opener(page, entry, root, cell);
  await releaseParkedFetches(page);
  expect(opened.pageErrors, 'the page threw no error while it loaded and while the state was reached').toEqual([]);
  await markPortal(page, root);

  const applied = await page.evaluate(([selector, kind]) => {
    const wrapper = document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null;

    if (kind === 'dark') {
      return !!wrapper && /ht-theme-\w+-dark/.test(`${wrapper.className} ${wrapper.closest('[class*="ht-theme-"]')?.className ?? ''}`);
    }
    if (kind === 'rtl') {
      return !!(wrapper?.__hotInstance as unknown as { isRtl(): boolean } | undefined)?.isRtl();
    }

    return true;
  }, [root, variant] as const);
  const environment = await readEnvironment(page);
  const results = await new AxeBuilder({ page }).withTags(DISCOVERY_TAGS).include(root).include(PORTAL).analyze();
  const findings = applied ? discoveryFindings({ violations: results.violations, incomplete: results.incomplete }) : [];

  await attachEvidence(testInfo, {
    target,
    startedAt,
    environment,
    findings,
    criteria: [],
    detail: {
      variantApplied: applied,
      axeCoreVersion: results.testEngine.version,
      counts: { violations: results.violations.length, incomplete: results.incomplete.length, passes: results.passes.length },
      rules: {
        violations: results.violations.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
        incomplete: results.incomplete.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
      },
    },
  });
}

/**
 * Declares one scan, in a describe block that emulates a device when one is named.
 *
 * @param title The title.
 * @param device The device, or none.
 * @param body The test.
 */
function declare(title: string, device: string | undefined, body: (args: { page: Page }, testInfo: TestInfo) => Promise<void>): void {
  if (device) {
    test.describe(() => {
      test.use(device === 'Pixel 7' ? (({ defaultBrowserType: _browser, ...options }) => options)(devices[device]) : emulate(device));
      test(title, body);
    });
  } else {
    test(title, body);
  }
}

const PAGES: DiscoveryPage[] = [...A11Y_PAGES, ...DISCOVERY_PAGES] as DiscoveryPage[];

for (const theme of A11Y_THEMES) {
  for (const entry of PAGES) {
    declare(`discover ${entry.id} on ${theme}`, entry.device, ({ page }, testInfo) => discover(page, testInfo, entry, theme, null));
    if (!entry.id.startsWith('dark-')) {
      declare(`discover ${entry.id} on ${theme} (dark)`, entry.device, ({ page }, testInfo) => discover(page, testInfo, entry, theme, 'dark'));
    }
  }
  for (const entry of PAGES.filter(item => item.device)) {
    declare(`discover ${entry.id} on ${theme} (Pixel 7)`, 'Pixel 7', ({ page }, testInfo) => discover(page, testInfo, { ...entry, device: 'Pixel 7' }, theme, 'pixel-7'));
  }
}
for (const entry of PAGES.filter(item => !item.id.startsWith('rtl-'))) {
  declare(`discover ${entry.id} on main (right to left)`, entry.device, ({ page }, testInfo) => discover(page, testInfo, entry, 'main', 'rtl'));
}
