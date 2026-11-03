import { readFileSync } from 'node:fs';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y_PAGES, fixtureUrl, type A11yPage, type A11yState } from '../pages.mjs';
import { PORTAL, STATES, emulate, highlightMenuItem, markPortal, openTarget, selectCell, type RootWrapper } from '../harness';
import { attachEvidence, declareTarget, readEnvironment } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import { pageLines } from '../../lib/a11y-check-run.mjs';
import { DISCOVERY_TAGS, discoveryFindings, rightToLeftQuery } from '../../lib/axe-discovery.mjs';
import { DISCOVERY_PAGES } from './discovery-pages.mjs';

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
 *   fixtures that read it, so the grid and its portal are built dark from the start.
 * - **Right to left** (the main theme): the fixture is served with `dir="rtl"` on its `<html>` and with
 *   the direction query it reads (`rightToLeftQuery()`), so the grid is built right to left.
 *
 * A variant that did not apply (no dark class on the grid, or a grid still left to right) fails its test
 * as a tooling error: the document lists the target as not measured, never as a clean pass.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

type DiscoveryState = A11yState | 'focused-cell' | 'header-button-hover' | 'filter-option-focused' | 'multi-range'
  | 'context-menu-submenu-2' | 'sheets-bar-rename' | 'dialog-focused';
type DiscoveryPage = Omit<A11yPage, 'state'> & { state: DiscoveryState };

// A discovery page is not in `a11y/pages.mjs`, the file the check run annotates a page's findings on, so
// its records name their entry in `discovery-pages.mjs` instead.
const DISCOVERY_FILE = 'tests/a11y/checks/discovery-pages.mjs';
const DISCOVERY_LINES = pageLines(readFileSync(new URL('./discovery-pages.mjs', import.meta.url), 'utf8'));

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
    const selected = await page.evaluate((selector) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

      return hot ? hot.selectCells([[1, 1, 2, 2], [4, 3, 6, 4]]) : null;
    }, root);

    expect(selected, 'two ranges selected').toBe(true);
  },
  'context-menu-submenu-2': async(page, entry, root, cell) => {
    await STATES['context-menu'](page, entry as A11yPage, root, cell);
    await highlightMenuItem(page, '.htContextMenu', 'Level one');

    // A submenu opens toward the inline end: ArrowLeft in a right-to-left grid.
    const rtl = await page.evaluate((selector) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
        { isRtl(): boolean } | undefined;

      return !!hot?.isRtl();
    }, root);
    const inward = rtl ? 'ArrowLeft' : 'ArrowRight';

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
  // The guides a drag draws exist only while the pointer is held, so the scan runs mid-drag.
  'column-move-guide': async(page, _entry, root) => {
    const from = await headerCenter(page, root, 1);
    const to = await headerCenter(page, root, 3);

    await page.mouse.click(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await expect(page.locator(`${root} .ht__manualColumnMove--guideline`)).toBeVisible();
  },
  'column-resize-guide': async(page, _entry, root) => {
    const header = await headerCenter(page, root, 1);

    await page.mouse.move(header.x, header.y);

    const handle = await page.locator(`${root} .manualColumnResizer`).first().boundingBox();

    expect(handle, 'the resize handle shows on the hovered header').not.toBeNull();
    await page.mouse.move(handle!.x + (handle!.width / 2), handle!.y + (handle!.height / 2));
    await page.mouse.down();
    await page.mouse.move(handle!.x + (handle!.width / 2) + 40, handle!.y + (handle!.height / 2), { steps: 6 });
    await expect(page.locator(`${root} .manualColumnResizerGuide`)).toBeVisible();
  },
  'dialog-focused': async(page, _entry, root) => {
    const found = await page.evaluate((selector) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
        { listen(): void; getPlugin(name: 'dialog'): { focus(): void } } | undefined;

      hot?.listen();
      hot?.getPlugin('dialog').focus();

      return !!hot;
    }, root);

    expect(found, `the grid under ${root} has a Handsontable instance`).toBe(true);
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('.ht-dialog') !== null),
      { message: 'the focus is inside the dialog' }).toBe(true);
  },
};

/**
 * The center of a column header's topmost copy, in viewport pixels.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param col The column.
 * @returns The point.
 */
async function headerCenter(page: Page, root: string, col: number): Promise<{ x: number; y: number }> {
  const point = await page.evaluate(([selector, column]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
      { getCell(row: number, col: number, topmost?: boolean): HTMLElement | null } | undefined;
    const box = hot?.getCell(-1, column, true)?.getBoundingClientRect();

    return box ? { x: box.x + (box.width / 2), y: box.y + (box.height / 2) } : null;
  }, [root, col] as const);

  expect(point, `column header ${col} is drawn`).not.toBeNull();

  return point!;
}

/**
 * Builds every theme class the page writes as its dark form, before the fixture runs.
 *
 * @param page The page.
 */
async function installDarkScheme(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const darken = (value: unknown) => (typeof value === 'string'
      ? value.replace(/\bht-theme-(main|horizon|classic)\b(?!-dark)/g, 'ht-theme-$1-dark')
      : value);
    const className = Object.getOwnPropertyDescriptor(Element.prototype, 'className')!;
    const setAttribute = Element.prototype.setAttribute;
    const add = DOMTokenList.prototype.add;

    Object.defineProperty(Element.prototype, 'className', {
      ...className,
      set(value: string) {
        className.set!.call(this, darken(value) as string);
      },
    });
    Element.prototype.setAttribute = function(name: string, value: string) {
      return setAttribute.call(this, name, name === 'class' ? darken(value) as string : value);
    };
    DOMTokenList.prototype.add = function(...tokens: string[]) {
      return add.apply(this, tokens.map(token => darken(token) as string));
    };
  });
}

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
 * The query a fixture takes to build its grid right to left (`rightToLeftQuery()` reads its source).
 *
 * @param fixture The fixture's file name.
 * @returns The query to append, or an empty string.
 */
function rtlQuery(fixture: string): string {
  return rightToLeftQuery(readFileSync(new URL(`../../fixtures/demo/${fixture}`, import.meta.url), 'utf8'));
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

  // A variant that did not build is a tooling failure, so it never reads as a clean pass and axe never
  // runs on the page it did not build.
  expect(applied, `the ${variant} variant applied to ${entry.fixture}`).toBe(true);

  const environment = await readEnvironment(page);
  // Passing rules keep one node each: only their count is read. `options()` replaces every option, so it
  // comes before `withTags()`.
  const results = await new AxeBuilder({ page }).options({ resultTypes: ['violations', 'incomplete'] })
    .withTags(DISCOVERY_TAGS).include(root).include(PORTAL).analyze();
  const line = DISCOVERY_LINES.get(entry.id);
  const findings = discoveryFindings({ violations: results.violations, incomplete: results.incomplete }, line ? { file: DISCOVERY_FILE, line } : {});

  await attachEvidence(testInfo, {
    target,
    startedAt,
    environment,
    findings,
    criteria: [],
    pageErrors: opened.pageErrors,
    detail: {
      axeCoreVersion: results.testEngine.version,
      counts: { violations: results.violations.length, incomplete: results.incomplete.length, passes: results.passes.length },
      rules: {
        violations: results.violations.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
        incomplete: results.incomplete.map(rule => ({ id: rule.id, impact: rule.impact, tags: rule.tags, nodes: rule.nodes.length })),
      },
    },
  });
}

const PAGES: DiscoveryPage[] = [...A11Y_PAGES, ...DISCOVERY_PAGES] as DiscoveryPage[];
// Every scan: each page on each theme, light and dark (a `dark-*` page is dark already), each phone page
// again on a Pixel 7, and each page right to left on the main theme (an `rtl-*` page is already).
const SCANS: Array<{ title: string; entry: DiscoveryPage; theme: string; variant: string | null }> = [];

for (const theme of A11Y_THEMES) {
  for (const entry of PAGES) {
    SCANS.push({ title: `discover ${entry.id} on ${theme}`, entry, theme, variant: null });
    if (!entry.id.startsWith('dark-')) {
      SCANS.push({ title: `discover ${entry.id} on ${theme} (dark)`, entry, theme, variant: 'dark' });
    }
  }
  for (const entry of PAGES.filter(item => item.device)) {
    SCANS.push({ title: `discover ${entry.id} on ${theme} (Pixel 7)`, entry: { ...entry, device: 'Pixel 7' }, theme, variant: 'pixel-7' });
  }
}
for (const entry of PAGES.filter(item => !item.id.startsWith('rtl-'))) {
  SCANS.push({ title: `discover ${entry.id} on main (right to left)`, entry, theme: 'main', variant: 'rtl' });
}

for (const { title, entry, theme, variant } of SCANS) {
  const body = async({ page }: { page: Page }, testInfo: TestInfo) => discover(page, testInfo, entry, theme, variant);

  if (entry.device) {
    const device = entry.device;

    test.describe(() => {
      test.use(emulate(device));
      test(title, body);
    });
  } else {
    test(title, body);
  }
}
