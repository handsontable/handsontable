import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, devices, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { awaitBundle } from '../fixtures/bundle';
import {
  A11Y_THEMES,
  findingsFromScan,
  marksForScan,
  representativeScans,
  type BaselineEntry,
  type NodeBox,
  type ScanMark,
} from '../lib/a11y-baseline.mjs';
import { A11Y_PAGES, type A11yPage, type A11yState } from './pages.mjs';

/**
 * The axe scan: every page of `pages.mjs` on every theme, through `@axe-core/playwright`,
 * against the WCAG 2.2 A and AA rule set (the level the published Accessibility Conformance
 * Report claims). The scan includes the grid's root container and that grid's own portal (its
 * `rootPortalElement`, where menus and the comment editor render) and nothing else on the fixture
 * page: the fixture's own buttons and text, and any other grid on it, are not under test. A page
 * that throws, or whose theme stylesheet did not load, is a red test before anything is scanned.
 *
 * A test here never fails on a violation. It writes the raw axe result to
 * `test-results/a11y/scans/<page>--<theme>.json` (the CI artifact) and attaches it. Every
 * violating node carries what locates it: axe's selector, its full DOM path (`ancestry`) and its
 * box on the page. When the scan holds a finding the baseline does not (new, or on more nodes than
 * recorded), or it is the page a known issue is pictured on in the HTML report, the spec also
 * outlines and numbers those nodes and saves a screenshot beside the JSON (`marksForScan()` in
 * `lib/a11y-baseline.mjs` picks them); the reporter
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
// The scanned grid's own portal, marked before the scan (`markPortal()`). Every instance appends a
// `.ht-portal` to `body`, so on a page with several grids the class alone would scan the portals of
// the grids that are not under test too, and their findings would be keyed to this page.
const PORTAL_MARK = 'data-a11y-scan-portal';
const PORTAL = `[${PORTAL_MARK}]`;
// A token every theme stylesheet defines (`--ht-line-height`, which the core also probes): an empty
// value on the grid means the theme's `.min.css` did not load, and contrast and target size would
// then be measured on an unstyled grid.
const THEME_TOKEN = '--ht-line-height';
// How many ArrowDown presses may be needed to reach a menu item; the default context menu has
// fewer than twenty rows, separators included.
const MENU_WALK_LIMIT = 30;
// The outline colors of the screenshot marks, matching the report's numbered legend: new is the
// critical red, grown a dark orange, a pictured known issue a dark blue. Each carries its number in
// white, so each clears 4.5:1 against white.
const MARK_COLORS: Record<ScanMark['status'], string> = { new: '#d03b3b', grown: '#b85a2f', known: '#1c5cab' };

/**
 * The committed baseline, read once: the marks compare each scan with it. A baseline that does not
 * parse marks nothing here; the reporter reports it as a tooling failure.
 */
const BASELINE_ENTRIES: BaselineEntry[] = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./axe-baseline.json', import.meta.url), 'utf8')).entries ?? [];
  } catch {
    return [];
  }
})();
const PICTURED = representativeScans(BASELINE_ENTRIES);

type GridWindow = Window & {
  htBuildError?: string;
  htServer?: { release(prefix: string): void };
  startRequest?: (row: number, col: number) => number;
};

// The Handsontable instance that owns a root container is read inside the page through the
// `__hotInstance` the core stamps on its root wrapper, so no page needs to say which global holds
// its grid (the fixtures differ: `hot`, `hots['menus-grid']`, `hotStyled`, or none). The lookup is
// spelled out in each `evaluate` callback: Playwright serializes the callback's source, so a helper
// defined here is not visible in the page.
type HotInstance = {
  selectCell(row: number, col: number): boolean;
  selectCells(ranges: number[][]): boolean;
  getActiveEditor(): { isOpened(): boolean; htEditor?: { countRenderedRows(): number } } | undefined;
  rootPortalElement: HTMLElement;
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
  // The fixture fills the cell from a promise it never settles, so the cell stays pending: the
  // indicator, the pending message and `aria-busy` are what the scan sees.
  'async-pending': async(page, _entry, root, [row, col]) => {
    await page.evaluate(([r, c]) => (window as GridWindow).startRequest?.(r, c), [row, col] as const);
    await expect(page.locator(`${root} .ht_master td.htAsyncPending .htAsyncIndicator`)).toBeVisible();
  },
};

/**
 * The context options that emulate a device, without its browser: every page runs on the project's
 * Chromium, and a describe block may not switch the browser.
 *
 * @param name The device, as Playwright's `devices` names it.
 * @returns The options for `test.use()`.
 */
function emulate(name: string) {
  const { defaultBrowserType: _browser, ...options } = devices[name];

  return options;
}

for (const theme of A11Y_THEMES) {
  for (const entry of A11Y_PAGES) {
    const scan = async({ page }: { page: Page }, testInfo: TestInfo) => {
      const root = entry.root ?? DEFAULT_ROOT;
      const cell = entry.cell ?? DEFAULT_CELL;
      const url = `/tests/fixtures/demo/${entry.fixture}?theme=${theme}${entry.query ? `&${entry.query}` : ''}`;
      const started = Date.now();

      // Any uncaught error on the page is a red test, not a scan of a half-built grid: about half the
      // fixtures report no constructor error of their own (`htBuildError`, `data-init-error`), and a
      // plugin that throws after the root wrapper is in the DOM leaves a page that still looks ready.
      const pageErrors: string[] = [];

      page.on('pageerror', error => pageErrors.push(String(error.stack ?? error)));
      await page.goto(url);
      await awaitBundle(page);
      await expect(page.locator(root).locator('.ht-root-wrapper')).toBeVisible();
      expect(await page.evaluate(([selector, token]) => {
        const wrapper = document.querySelector(selector)?.querySelector('.ht-root-wrapper');

        return wrapper ? getComputedStyle(wrapper).getPropertyValue(token).trim() : '';
      }, [root, THEME_TOKEN] as const), `the ${theme} theme stylesheet styles the grid (${THEME_TOKEN} is set); `
        + 'build it with `npm --prefix handsontable run build:themes-css.min`').not.toBe('');

      // A constructor throw is a red test with its cause, never a scan of a blank container:
      // the fixtures report it either way, as the contract in tests/AGENTS.md says.
      const buildError = await page.evaluate((selector) => (window as GridWindow).htBuildError
        ?? document.querySelector(selector)?.getAttribute('data-init-error') ?? null, root);

      expect(buildError, 'the fixture built its grid').toBeNull();

      await STATES[entry.state](page, entry, root, cell);
      expect(pageErrors, 'the page threw no error while it loaded and while the state was reached').toEqual([]);
      await markPortal(page, root);

      // `options()` replaces the option object and `withTags()` adds to it, so the options go first.
      // `ancestry` adds each node's full DOM path, which locates it where axe's short selector is ambiguous.
      const results = await new AxeBuilder({ page })
        .options({ ancestry: true })
        .withTags(WCAG_TAGS)
        .include(root)
        .include(PORTAL)
        .analyze();
      const scansDir = path.join(testInfo.project.outputDir, 'scans');

      mkdirSync(scansDir, { recursive: true });
      await measureNodes(page, results.violations);

      const marks = marksForScan({
        findings: findingsFromScan({ page: entry.id, theme, violations: results.violations }),
        entries: BASELINE_ENTRIES.filter(item => item.page === entry.id && item.theme === theme),
        pictured: PICTURED.get(`${entry.id}|${theme}`),
      });
      const screenshot = marks.length > 0 ? `${entry.id}--${theme}.jpg` : null;
      let clip: NodeBox | null = null;

      if (screenshot) {
        clip = await outlineMarks(page, marks, root);
        await page.screenshot({ path: path.join(scansDir, screenshot), type: 'jpeg', quality: 75, fullPage: true, clip });
      }

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
        incomplete: results.incomplete.map(result => ({ id: result.id, impact: result.impact, nodes: result.nodes.length })),
        screenshot,
        clip,
        marks: marks.map(({ selectors, ...mark }) => mark),
      };
      const file = path.join(scansDir, `${entry.id}--${theme}.json`);

      writeFileSync(file, `${JSON.stringify(scan, null, 2)}\n`);
      await testInfo.attach('axe-scan', { path: file, contentType: 'application/json' });
    };
    const title = `${entry.id} on ${theme}`;

    if (entry.device) {
      // The device is set before the page loads: the core decides at construction whether it runs on a
      // phone (`isMobileOrIpadOS()`), so emulating it after the load would scan the desktop grid.
      const device = entry.device;

      test.describe(() => {
        test.use(emulate(device));
        test(title, scan);
      });
    } else {
      test(title, scan);
    }
  }
}

/**
 * Adds each violating node's box on the page (`box`, page coordinates, or `null` when the node
 * has none: hidden, collapsed or gone) to the axe results, in place, in one round trip.
 *
 * @param page The page.
 * @param violations The axe violations.
 */
async function measureNodes(page: Page, violations: Array<{ nodes: Array<{ target: unknown[]; box?: NodeBox | null }> }>): Promise<void> {
  const selectors = violations.flatMap(violation => violation.nodes.map(node => node.target.at(-1)));
  const boxes = await page.evaluate(list => list.map((css) => {
    const node = typeof css === 'string' ? document.querySelector(css) : null;
    const rect = node?.getBoundingClientRect();

    return rect && rect.width > 0 && rect.height > 0
      ? { x: Math.round(rect.left + window.scrollX), y: Math.round(rect.top + window.scrollY), width: Math.round(rect.width), height: Math.round(rect.height) }
      : null;
  }), selectors);
  let index = 0;

  for (const violation of violations) {
    for (const node of violation.nodes) {
      node.box = boxes[index];
      index += 1;
    }
  }
}

/**
 * Outlines every node of every mark on the page and numbers it, in an overlay above everything
 * else that takes no pointer events. A node with no box (a hidden editor input) gets a small
 * marker at its position, so its number still shows. Runs after the scan, so the overlay is never
 * part of what axe saw. Returns the page area to photograph: the grid's tables, slots and overlays,
 * whatever its portal shows (an open menu or editor), and every outline, with a margin around them.
 *
 * @param page The page.
 * @param marks The marks.
 * @param root The root container selector.
 * @returns The clip, in page coordinates.
 */
async function outlineMarks(page: Page, marks: ScanMark[], root: string): Promise<NodeBox> {
  return page.evaluate(([list, colors, rootSelector, portalSelector]) => {
    const layer = document.createElement('div');

    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0 auto auto 0;width:0;height:0;z-index:2147483647;pointer-events:none';
    for (const mark of list) {
      for (const selector of mark.selectors) {
        const css = selector.at(-1);
        const node = typeof css === 'string' ? document.querySelector(css) : null;

        if (!node) {
          continue;
        }

        const rect = node.getBoundingClientRect();
        const box = document.createElement('div');
        const label = document.createElement('span');
        const color = colors[mark.status];

        box.style.cssText = `position:absolute;left:${rect.left + window.scrollX - 2}px;top:${rect.top + window.scrollY - 2}px;`
          + `width:${Math.max(rect.width, 8) + 4}px;height:${Math.max(rect.height, 8) + 4}px;`
          + `outline:3px solid ${color};outline-offset:0;box-sizing:border-box`;
        label.textContent = String(mark.n);
        label.style.cssText = 'position:absolute;left:-3px;top:-22px;min-width:18px;padding:1px 5px;border-radius:9px;'
          + `background:${color};color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center`;
        box.append(label);
        layer.append(box);
      }
    }
    document.body.append(layer);

    // The grid's root container is as wide as the page; its tables, slots and overlays are as wide as
    // what they draw, so the crop follows them.
    const rootNode = document.querySelector(rootSelector);
    const drawn = rootNode ? [...rootNode.querySelectorAll('.htCore, .ht-slot-top > *, .ht-slot-bottom > *, .ht-overlay > *')] : [];
    const areas = [...(drawn.length > 0 ? drawn : [rootNode]), ...document.querySelectorAll(`${portalSelector} > *`), ...layer.children]
      .filter((node): node is Element => !!node)
      .map(node => node.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0)
      // The outline's number sits above its box.
      .map(rect => ({ left: rect.left + window.scrollX, top: rect.top + window.scrollY - 24, right: rect.right + window.scrollX, bottom: rect.bottom + window.scrollY }));
    const margin = 16;
    const left = Math.max(0, Math.min(...areas.map(area => area.left)) - margin);
    const top = Math.max(0, Math.min(...areas.map(area => area.top)) - margin);
    const right = Math.min(document.documentElement.scrollWidth, Math.max(...areas.map(area => area.right)) + margin);
    const bottom = Math.min(document.documentElement.scrollHeight, Math.max(...areas.map(area => area.bottom)) + margin);

    return { x: Math.round(left), y: Math.round(top), width: Math.max(1, Math.round(right - left)), height: Math.max(1, Math.round(bottom - top)) };
  }, [marks, MARK_COLORS, root, PORTAL] as const);
}

/**
 * Marks the scanned grid's own portal (`rootPortalElement`), so the scan includes it and no other
 * grid's portal.
 *
 * @param page The page.
 * @param root The root container selector.
 */
async function markPortal(page: Page, root: string): Promise<void> {
  const marked = await page.evaluate(([selector, attribute]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance;

    hot?.rootPortalElement?.setAttribute(attribute, '');

    return !!hot?.rootPortalElement;
  }, [root, PORTAL_MARK] as const);

  expect(marked, `the grid under ${root} has a portal to scan`).toBe(true);
}
