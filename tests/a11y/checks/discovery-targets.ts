import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { A11Y_PAGES, type A11yPage, type A11yState } from '../pages.mjs';
import {
  fixtureUrl,
  STATES,
  highlightMenuItem,
  isRightToLeft,
  markPortal,
  openTarget,
  releaseParkedFetches,
  selectCell,
  type OpenedTarget,
  type RootWrapper,
} from '../harness';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import { rightToLeftQuery } from '../../lib/axe-discovery.mjs';
import { DISCOVERY_PAGES } from './discovery-pages.mjs';
import { darkSchemeApplied, installDarkScheme } from './variants';

/**
 * The targets of the axe discovery run and how each one is opened: the pages (the catalog and
 * `discovery-pages.mjs`), the states only the discovery run reaches, and the variants it builds a page
 * in. Two specs open them, so the list and the openers live here and not in either:
 *
 * - `axe-discovery.spec.ts` (nightly) opens every target and scans it with axe;
 * - `../discovery-targets.spec.ts` (every pull request, in the axe scan's job) opens the targets no
 *   pull request builds otherwise, on the main theme, and scans nothing, so a page that does not build
 *   a variant fails on the pull request that adds it and not in the next audit.
 *
 * The variants:
 *
 * - **Dark** (every theme): a script installed before the fixture loads turns every `ht-theme-<name>`
 *   class the page or the grid writes into `ht-theme-<name>-dark`, the way `?scheme=dark` does on the
 *   fixtures that read it, so the grid and its portal are built dark from the start.
 * - **Right to left** (the main theme): the fixture is served with `dir="rtl"` on its `<html>` and with
 *   the direction query it reads (`rightToLeftQuery()`), so the grid is built right to left.
 * - **Pixel 7** (a page with a `device`): the page again on a second phone.
 *
 * A variant that did not apply (no dark class on the grid, or a grid still left to right) fails its test
 * as a tooling error. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export type DiscoveryState = A11yState | 'focused-cell' | 'header-button-hover' | 'filter-option-focused' | 'multi-range'
  | 'context-menu-submenu-2' | 'sheets-bar-rename' | 'dialog-focused';
export type DiscoveryPage = Omit<A11yPage, 'state'> & { state: DiscoveryState };

/**
 * One target: a page on a theme, in a variant or as the fixture builds it (`null`).
 */
export interface DiscoveryScan {
  title: string;
  entry: DiscoveryPage;
  theme: string;
  variant: string | null;
}

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
    const inward = await isRightToLeft(page, root) ? 'ArrowLeft' : 'ArrowRight';

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

const PAGES: DiscoveryPage[] = [...A11Y_PAGES, ...DISCOVERY_PAGES] as DiscoveryPage[];

/**
 * Every target: each page on each theme, light and dark (a `dark-*` page is dark already), each phone
 * page again on a Pixel 7, and each page right to left on the main theme (an `rtl-*` page is already).
 */
export const DISCOVERY_SCANS: DiscoveryScan[] = [];

for (const theme of A11Y_THEMES) {
  for (const entry of PAGES) {
    DISCOVERY_SCANS.push({ title: `discover ${entry.id} on ${theme}`, entry, theme, variant: null });
    if (!entry.id.startsWith('dark-')) {
      DISCOVERY_SCANS.push({ title: `discover ${entry.id} on ${theme} (dark)`, entry, theme, variant: 'dark' });
    }
  }
  for (const entry of PAGES.filter(item => item.device)) {
    DISCOVERY_SCANS.push({ title: `discover ${entry.id} on ${theme} (Pixel 7)`, entry: { ...entry, device: 'Pixel 7' }, theme, variant: 'pixel-7' });
  }
}
for (const entry of PAGES.filter(item => !item.id.startsWith('rtl-'))) {
  DISCOVERY_SCANS.push({ title: `discover ${entry.id} on main (right to left)`, entry, theme: 'main', variant: 'rtl' });
}

/**
 * The URL a target opens: the page's on its theme, with the direction query its fixture reads when the
 * variant is right to left.
 *
 * @param scan The target.
 * @returns The path and query.
 */
export function discoveryUrl({ entry, theme, variant }: DiscoveryScan): string {
  return `${fixtureUrl(entry, theme)}${variant === 'rtl' ? rtlQuery(entry.fixture) : ''}`;
}

/**
 * Opens a target: the page built in its variant and brought to its state, with its parked fetches
 * released and its portal marked. A test of a target with a `device` emulates it from the first load
 * (`emulate()` in the harness), which only the spec can declare.
 *
 * @param page The page.
 * @param scan The target.
 * @returns What locates the grid.
 */
export async function openDiscoveryTarget(page: Page, scan: DiscoveryScan): Promise<OpenedTarget> {
  const { entry, theme, variant } = scan;

  if (variant === 'dark') {
    await installDarkScheme(page);
  } else if (variant === 'rtl') {
    await installRightToLeft(page, entry.fixture);
  }

  const opened = await openTarget(page, entry as A11yPage, theme, { url: discoveryUrl(scan) });
  const { root, cell } = opened;
  const opener = DISCOVERY_STATES[entry.state] ?? STATES[entry.state as A11yState];

  await opener(page, entry, root, cell);
  await releaseParkedFetches(page);
  await markPortal(page, root);

  let applied = true;

  if (variant === 'dark') {
    applied = await darkSchemeApplied(page, root);
  } else if (variant === 'rtl') {
    applied = await isRightToLeft(page, root);
  }

  // A variant that did not build is a tooling failure, so it never reads as a clean pass and axe never
  // runs on the page it did not build.
  expect(applied, `the ${variant} variant applied to ${entry.fixture}`).toBe(true);

  return opened;
}
