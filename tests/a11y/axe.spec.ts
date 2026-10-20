import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { awaitBundle } from '../fixtures/bundle';
import { A11Y_THEMES } from '../lib/a11y-baseline.mjs';
import { A11Y_PAGES, type A11yPage, type A11yState } from './pages.mjs';

/**
 * The axe scan: every page of `pages.mjs` on every theme, through `@axe-core/playwright`,
 * against the WCAG 2.2 A and AA rule set (the level the published Accessibility Conformance
 * Report claims). The scan includes the grid's root container and its portal (`.ht-portal`,
 * where menus and the comment editor render) and nothing else on the fixture page: the
 * fixture's own buttons and text are not the product.
 *
 * A test here never fails on a violation. It writes the raw axe result to
 * `test-results/a11y/scans/<page>--<theme>.json` (the CI artifact) and attaches it; the reporter
 * (`reporters/a11y.ts`) compares every scan with the committed baseline
 * (`axe-baseline.json`) and decides the run's status from `A11Y_MODE`
 * (`lib/a11y-baseline.mjs`: `warn` keeps the job green, `block` fails it on a new finding or a
 * stale entry). What fails a test is tooling: a fixture that does not load, a constructor
 * throw, a menu or an editor the keyboard did not open. Policy and how to add a page:
 * `tests/AGENTS.md`, "A11y: the axe scan and its baseline".
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const DEFAULT_ROOT = '[data-testid="grid"]';
const DEFAULT_CELL: [number, number] = [1, 1];
const PORTAL = '.ht-portal';
// How many ArrowDown presses may be needed to reach a menu item; the default context menu has
// fewer than twenty rows, separators included.
const MENU_WALK_LIMIT = 30;
type GridWindow = Window & {
  htBuildError?: string;
  htServer?: { release(prefix: string): void };
};

// The Handsontable instance that owns a root container is read inside the page through the
// `__hotInstance` the core stamps on its root wrapper, so no page needs to say which global holds
// its grid (the fixtures differ: `hot`, `hots['menus-grid']`, `hotStyled`, or none). The lookup is
// spelled out in each `evaluate` callback: Playwright serializes the callback's source, so a helper
// defined here is not visible in the page.
type HotInstance = {
  selectCell(row: number, col: number): boolean;
  getActiveEditor(): { isOpened(): boolean; htEditor?: { countRenderedRows(): number } } | undefined;
  getPlugin(name: string): { showAtCell(row: number, col: number): void };
};
type RootWrapper = HTMLElement & { __hotInstance?: HotInstance };

/**
 * Selects a cell through the API, so the keyboard reaches the grid.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell.
 */
async function selectCell(page: Page, root: string, cell: [number, number]): Promise<void> {
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
async function highlightMenuItem(page: Page, menu: string, label: string): Promise<void> {
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
async function expectEditorOpen(page: Page, root: string): Promise<void> {
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
 * The state each page is scanned in. Every opener drives the real keyboard where the surface
 * has a shortcut, so the scanned DOM is the one a keyboard user reaches.
 */
const STATES: Record<A11yState, (page: Page, entry: A11yPage, root: string, cell: [number, number]) => Promise<void>> = {
  none: async() => {},
  'context-menu': async(page, _entry, root, cell) => {
    await selectCell(page, root, cell);
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('.htContextMenu .ht_master .htCore tbody td').first()).toBeVisible();
  },
  'context-menu-submenu': async(page, entry, root, cell) => {
    await STATES['context-menu'](page, entry, root, cell);
    await highlightMenuItem(page, '.htContextMenu', 'Alignment');
    await page.keyboard.press('ArrowRight');
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
    await page.evaluate(([selector, [row, col]]) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

      hot?.getPlugin('comments').showAtCell(row, col);
    }, [root, cell] as const);
    await expect(page.locator('.htComments .htCommentTextArea')).toBeVisible();
  },
  'data-provider': async(page, _entry, root) => {
    // The fixture parks every fetch until the test releases it; the grid is empty with the
    // loading overlay until then, which the `loading` and `empty-data` pages already cover.
    await page.evaluate(() => (window as GridWindow).htServer?.release('ORD'));
    await expect(page.locator(`${root} .ht_master .htCore tbody td`).first()).toBeVisible();
  },
};

for (const theme of A11Y_THEMES) {
  for (const entry of A11Y_PAGES) {
    test(`${entry.id} on ${theme}`, async({ page }, testInfo) => {
      const root = entry.root ?? DEFAULT_ROOT;
      const cell = entry.cell ?? DEFAULT_CELL;
      const url = `/tests/fixtures/demo/${entry.fixture}?theme=${theme}${entry.query ? `&${entry.query}` : ''}`;
      const started = Date.now();

      await page.goto(url);
      await awaitBundle(page);
      await expect(page.locator(root).locator('.ht-root-wrapper')).toBeVisible();

      // A constructor throw is a red test with its cause, never a scan of a blank container:
      // the fixtures report it either way, as the contract in tests/AGENTS.md says.
      const buildError = await page.evaluate((selector) => (window as GridWindow).htBuildError
        ?? document.querySelector(selector)?.getAttribute('data-init-error') ?? null, root);

      expect(buildError, 'the fixture built its grid').toBeNull();

      await STATES[entry.state](page, entry, root, cell);

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .include(root)
        .include(PORTAL)
        .analyze();

      const scansDir = path.join(testInfo.project.outputDir, 'scans');

      mkdirSync(scansDir, { recursive: true });

      const scan = {
        page: entry.id,
        theme,
        fixture: entry.fixture,
        url,
        state: entry.state,
        surface: entry.surface,
        axeCoreVersion: results.testEngine.version,
        timestamp: results.timestamp,
        durationMs: Date.now() - started,
        counts: {
          violations: results.violations.length,
          incomplete: results.incomplete.length,
          passes: results.passes.length,
          inapplicable: results.inapplicable.length,
        },
        violations: results.violations,
        // The stock HTML report lists what axe could not decide too ("incomplete"); passes and
        // inapplicable rules are left out, which keeps every scan file small.
        incomplete: results.incomplete,
      };
      const file = path.join(scansDir, `${entry.id}--${theme}.json`);

      writeFileSync(file, `${JSON.stringify(scan, null, 2)}\n`);
      await testInfo.attach('axe-scan', { path: file, contentType: 'application/json' });
    });
  }
}
