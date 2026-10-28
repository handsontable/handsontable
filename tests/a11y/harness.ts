import { expect, devices, type Page } from '@playwright/test';
import { awaitBundle } from '../fixtures/bundle';
import { fixtureUrl, type A11yPage, type A11yState } from './pages.mjs';

/**
 * The shared half of the accessibility tier: how a page of the catalog (`pages.mjs`) is opened, how
 * its state is reached from the keyboard, and the guards that make a half-built page a red test
 * rather than a measurement. The axe scan (`axe.spec.ts`) and every check in `checks/` go through
 * here, so a menu, an editor or a selection is the same DOM for all of them. Policy:
 * `tests/AGENTS.md`, "A11y: the axe scan and its baseline" and "A11y: the checks beyond axe".
 */

export const DEFAULT_ROOT = '[data-testid="grid"]';
export const DEFAULT_CELL: [number, number] = [1, 1];
// The scanned grid's own portal, marked before a measurement (`markPortal()`). Every instance appends a
// `.ht-portal` to `body`, so on a page with several grids the class alone would include the portals of
// the grids that are not under test too, and their findings would be keyed to this page.
export const PORTAL_MARK = 'data-a11y-scan-portal';
export const PORTAL = `[${PORTAL_MARK}]`;
// A token every theme stylesheet defines (`--ht-line-height`, which the core also probes): an empty
// value on the grid means the theme's `.min.css` did not load, and contrast and target size would
// then be measured on an unstyled grid.
export const THEME_TOKEN = '--ht-line-height';
// How many ArrowDown presses may be needed to reach a menu item; the default context menu has
// fewer than twenty rows, separators included.
const MENU_WALK_LIMIT = 30;

export type GridWindow = Window & {
  htBuildError?: string;
  htServer?: { release(prefix: string): void };
  startRequest?: (row: number, col: number) => number;
};

// The Handsontable instance that owns a root container is read inside the page through the
// `__hotInstance` the core stamps on its root wrapper, so no page needs to say which global holds
// its grid (the fixtures differ: `hot`, `hots['menus-grid']`, `hotStyled`, or none). The lookup is
// spelled out in each `evaluate` callback: Playwright serializes the callback's source, so a helper
// defined here is not visible in the page.
export type HotInstance = {
  selectCell(row: number, col: number): boolean;
  selectCells(ranges: number[][]): boolean;
  getSelectedRangeLast(): { highlight: { row: number; col: number }; from: { row: number; col: number }; to: { row: number; col: number } } | undefined;
  getSelected(): number[][] | undefined;
  getActiveEditor(): { isOpened(): boolean; htEditor?: { countRenderedRows(): number } } | undefined;
  isListening(): boolean;
  countRows(): number;
  countCols(): number;
  rootElement: HTMLElement;
  rootPortalElement: HTMLElement;
};
export type RootWrapper = HTMLElement & { __hotInstance?: HotInstance };

/**
 * What `openTarget()` leaves: where the grid is, the cell a state opens on, the fixture's URL, and the
 * page errors collected so far (the list keeps growing until the test ends).
 */
export interface OpenedTarget {
  root: string;
  cell: [number, number];
  url: string;
  pageErrors: string[];
}

/**
 * Opens a page of the catalog on a theme and checks that it is fully built: no uncaught error, the
 * theme stylesheet applied, no constructor error the fixture captured. A page that fails any of these
 * is a red test with its cause, never a measurement of a half-built grid. The state is not reached
 * here: call `reachState()` next.
 *
 * Any uncaught error on the page is collected from before `goto()`: about half the fixtures report no
 * constructor error of their own (`htBuildError`, `data-init-error`), and a plugin that throws after
 * the root wrapper is in the DOM leaves a page that still looks ready.
 *
 * @param page The page.
 * @param entry The catalog entry.
 * @param theme The theme.
 * @param options.url The URL to open instead of the catalog's (a variant that adds a query).
 * @returns What locates the grid.
 */
export async function openTarget(page: Page, entry: A11yPage, theme: string, { url }: { url?: string } = {}): Promise<OpenedTarget> {
  const root = entry.root ?? DEFAULT_ROOT;
  const cell = entry.cell ?? DEFAULT_CELL;
  const target = url ?? fixtureUrl(entry, theme);
  const pageErrors: string[] = [];

  page.on('pageerror', error => pageErrors.push(String(error.stack ?? error)));
  await page.goto(target);
  await awaitBundle(page);
  await expect(page.locator(root).locator('.ht-root-wrapper')).toBeVisible();
  expect(await page.evaluate(([selector, token]) => {
    const wrapper = document.querySelector(selector)?.querySelector('.ht-root-wrapper');

    return wrapper ? getComputedStyle(wrapper).getPropertyValue(token).trim() : '';
  }, [root, THEME_TOKEN] as const), `the ${theme} theme stylesheet styles the grid (${THEME_TOKEN} is set); `
    + 'build it with `npm --prefix handsontable run build:themes-css.min`').not.toBe('');

  // A constructor throw is a red test with its cause, never a measurement of a blank container: the
  // fixtures report it either way, as the contract in tests/AGENTS.md says.
  const buildError = await page.evaluate(selector => (window as GridWindow).htBuildError
    ?? document.querySelector(selector)?.getAttribute('data-init-error') ?? null, root);

  expect(buildError, 'the fixture built its grid').toBeNull();

  return { root, cell, url: target, pageErrors };
}

/**
 * Reaches the state a catalog entry names, then checks that the page threw nothing on the way, and
 * marks the grid's portal.
 *
 * @param page The page.
 * @param entry The catalog entry.
 * @param opened What `openTarget()` returned.
 */
export async function reachState(page: Page, entry: A11yPage, opened: OpenedTarget): Promise<void> {
  await STATES[entry.state](page, entry, opened.root, opened.cell);
  expect(opened.pageErrors, 'the page threw no error while it loaded and while the state was reached').toEqual([]);
  await markPortal(page, opened.root);
}

/**
 * Selects a cell through the API, so the keyboard reaches the grid.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell.
 */
export async function selectCell(page: Page, root: string, cell: [number, number]): Promise<void> {
  const selected = await page.evaluate(([selector, [row, col]]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

    return hot ? hot.selectCell(row, col) : null;
  }, [root, cell] as const);

  expect(selected, `selectCell(${cell}) on ${root}`).toBe(true);
}

/**
 * Walks the highlighted item of an open menu down to the item with the given label, with
 * ArrowDown, and fails loudly when the walk never reaches it.
 *
 * @param page The page.
 * @param menu The menu's selector.
 * @param label The item's label.
 */
export async function highlightMenuItem(page: Page, menu: string, label: string): Promise<void> {
  const highlighted = page.locator(`${menu} .ht_master .htCore tbody td.current`);

  for (let press = 0; press < MENU_WALK_LIMIT; press++) {
    await page.keyboard.press('ArrowDown');
    await expect(highlighted).toHaveCount(1);
    if ((await highlighted.innerText()).trim() === label) {
      return;
    }
  }

  throw new Error(`ArrowDown never reached the ${JSON.stringify(label)} item of ${menu}`);
}

/**
 * Waits for the active editor to be open, and for a list editor to have drawn its choices.
 *
 * @param page The page.
 * @param root The root container selector.
 */
export async function expectEditorOpen(page: Page, root: string): Promise<void> {
  await expect.poll(() => page.evaluate((selector) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;
    const editor = hot?.getActiveEditor();

    if (!editor?.isOpened()) {
      return 'closed';
    }
    if (editor.htEditor && editor.htEditor.countRenderedRows() <= 0) {
      return 'list not drawn';
    }

    return 'open';
  }, root), { message: 'the editor opened from the keyboard' }).toBe('open');
}

/**
 * Opens the formula editor on a cell from the keyboard and replaces its text with typed text.
 *
 * @param page The page.
 * @param entry The scanned page entry.
 * @param root The grid container selector.
 * @param cell The cell to edit.
 * @param text The text to type.
 */
async function typeIntoFormulaEditor(
  page: Page, entry: A11yPage, root: string, cell: [number, number], text: string,
): Promise<void> {
  await STATES.editor(page, entry, root, cell);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text);
}

/**
 * Marks the popup portal hyperformula-ui mounts in the document body, so the scan includes it.
 *
 * @param page The page.
 */
async function markFormulaPopups(page: Page): Promise<void> {
  const marked = await page.evaluate((attribute) => {
    const portals = document.querySelectorAll('.hfe-popup-portal');

    portals.forEach(portal => portal.setAttribute(attribute, ''));

    return portals.length;
  }, PORTAL_MARK);

  expect(marked, 'the formula editor mounted its popup portal').toBeGreaterThan(0);
}

/**
 * The state each page is measured in. Every opener drives the real keyboard where the surface has a
 * shortcut, so the measured DOM is the one a keyboard user reaches.
 */
export const STATES: Record<A11yState, (page: Page, entry: A11yPage, root: string, cell: [number, number]) => Promise<void>> = {
  none: async() => {},
  'context-menu': async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('.htContextMenu .ht_master .htCore tbody td').first()).toBeVisible();
  },
  'context-menu-submenu': async(page, entry, root, cell) => {
    await STATES['context-menu'](page, entry, root, cell);
    await highlightMenuItem(page, '.htContextMenu', 'Alignment');

    // A submenu opens toward the inline end: ArrowLeft in a right-to-left grid (the axe discovery run's variant).
    const rtl = await page.evaluate((selector) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: { isRtl(): boolean } }) | null)?.__hotInstance;

      return !!hot?.isRtl();
    }, root);

    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.locator('.htContextMenuSub_Alignment .ht_master .htCore tbody td').first()).toBeVisible();
  },
  'dropdown-menu': async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await page.keyboard.press('Shift+Alt+ArrowDown');
    await expect(page.locator('.htDropdownMenu .ht_master .htCore tbody td').first()).toBeVisible();
  },
  editor: async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await page.keyboard.press('Enter');
    await expectEditorOpen(page, root);
  },
  comment: async(page, _entry, root, cell) => {
    // Ctrl+Alt+M on the grid context shows the comment editor and focuses it, which is the state a
    // keyboard user reaches; `showAtCell()` would only show it.
    await selectCell(page, root, cell);
    await page.keyboard.press('Control+Alt+M');
    await expect(page.locator('.htComments .htCommentTextArea')).toBeFocused();
  },
  'data-provider': async(page, _entry, root) => {
    // The fixture parks every fetch until the test releases it; the grid is empty with the
    // loading overlay until then, which the `loading` and `empty-data` pages already cover.
    await page.evaluate(() => (window as GridWindow).htServer?.release('ORD'));
    await expect(page.locator(`${root} .ht_master .htCore tbody td`).first()).toBeVisible();
  },
  // A selection draws what only exists while one is laid: the selection handles, on a desktop grid
  // that enables them and on a phone, where the core draws them itself.
  selection: async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await expect(page.locator(`${root} .ht_master td.current`)).toBeVisible();
  },
  // The desktop selection handles draw only while the pointer is over a selected range, so this
  // state selects three by three cells from `cell` and hovers the middle one: a pointer-only surface,
  // which the scan can still check for names and contrast.
  'selection-hover': async(page, _entry, root, [row, col]) => {
    const selected = await page.evaluate(([selector, [r, c]]) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

      return hot ? hot.selectCells([[r, c, r + 2, c + 2]]) : null;
    }, [root, [row, col]] as const);

    expect(selected, `selectCells from (${row}, ${col}) on ${root}`).toBe(true);
    await page.locator(`${root} .ht_master`).getByTestId(`cell-${row + 1}-${col + 1}`).hover();
    await expect(page.locator(`${root} .ht_master .wtSelectionHandle:visible`)).toHaveCount(4);
  },
  // hyperformula-ui mounts its popups in a portal of its own in the document body, outside the grid's
  // root and its `rootPortalElement`, so the state marks that portal for the scan too.
  'formula-suggestions': async(page, entry, root, cell) => {
    await typeIntoFormulaEditor(page, entry, root, cell, '=SU');
    await expect(page.locator('.hfe-suggestions [role="option"]').first()).toBeVisible();
    await markFormulaPopups(page);
  },
  'formula-function-help': async(page, entry, root, cell) => {
    await typeIntoFormulaEditor(page, entry, root, cell, '=SUM(');
    await expect(page.locator('.hfe-fn-help')).toBeVisible();
    await markFormulaPopups(page);
  },
  // The fixture fills the cell from a promise it never settles, so the cell stays pending: the
  // indicator, the pending message and `aria-busy` are what the scan sees.
  'async-pending': async(page, _entry, root, [row, col]) => {
    await page.evaluate(([r, c]) => (window as GridWindow).startRequest?.(r, c), [row, col] as const);
    await expect(page.locator(`${root} .ht_master td.htAsyncPending .htAsyncIndicator`)).toBeVisible();
  },
};

/**
 * Marks the measured grid's own portal (`rootPortalElement`), so a measurement includes it and no
 * other grid's portal.
 *
 * @param page The page.
 * @param root The root container selector.
 */
export async function markPortal(page: Page, root: string): Promise<void> {
  const marked = await page.evaluate(([selector, attribute]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

    hot?.rootPortalElement?.setAttribute(attribute, '');

    return !!hot?.rootPortalElement;
  }, [root, PORTAL_MARK] as const);

  expect(marked, `the grid under ${root} has a portal to measure`).toBe(true);
}

/**
 * The context options that emulate a device, without its browser: every page runs on the project's
 * Chromium, and a describe block may not switch the browser.
 *
 * @param name The device, as Playwright's `devices` names it.
 * @returns The options for `test.use()`.
 */
export function emulate(name: string) {
  const { defaultBrowserType: _browser, ...options } = devices[name];

  return options;
}

/**
 * Releases every request the data-provider fixture parks (`window.htServer`), until none has been pending
 * for two checks in a row. The catalog's `data-provider` opener releases the first fetch only, and a
 * fetch the grid makes after it (the bars' count, a page) lands or not depending on timing, which changed
 * what the bars showed from one run to the next. The checks beyond axe call this after `reachState()`;
 * the gating axe scan does not, so the state its baseline was taken in stays as it was. Ten rounds at
 * most; a page without the fixture server is left alone.
 *
 * @param page The page.
 */
export async function releaseParkedFetches(page: Page): Promise<void> {
  let quiet = 0;

  for (let round = 0; round < 10 && quiet < 2; round++) {
    const released = await page.evaluate(async() => {
      const server = (window as unknown as { htServer?: { release(prefix?: string): number } }).htServer;
      const count = server ? server.release() : 0;

      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      return count;
    });

    quiet = released === 0 ? quiet + 1 : 0;
  }
}
