import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { emulate, openTarget, reachState, releaseParkedFetches, selectCell, type RootWrapper } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import {
  FOCUS_CRITERIA,
  componentFindings,
  distinctName,
  dominantColor,
  floorRatio,
  focusFindings,
  indicatorChange,
  isDrawn,
  obscuredFindings,
  partContrast,
  strongestPixel,
} from '../../lib/contrast.mjs';
import { darkSchemeApplied, installDarkScheme } from './variants';

/**
 * Focus appearance and non-text contrast: WCAG 2.4.7, 2.4.11 and 1.4.11, measured from pixels on every
 * theme, light and dark.
 *
 * - **Focus indicators** (2.4.7, 1.4.11): the same small area is captured before the focus arrives and
 *   after it, by the keyboard, and the pixels that changed are the indicator (`indicatorChange()`).
 *   Nothing changed is `focus-not-visible`; a change under 3:1 against the colors next to it
 *   (`adjacentRatio`, read from the margin around the element) is `focus-indicator-contrast`. A menu
 *   item's highlight repaints the item itself, so it is judged against what it replaced. Cells (an
 *   arrow key), menu items (the highlight an arrow moves) and the controls of the bars, the dialog and
 *   the notification (a keyboard event, then the focus).
 * - **Parts that identify a component or its state** (1.4.11): the selection outline (the edge of a
 *   selected range, before and after) and the grid lines, each the strongest pixel against the area's
 *   dominant color (`strongestPixel()`); checkboxes and icons, read from the pixels inside their box
 *   (`partContrast()`). Under 3:1 is a finding. Grid lines are `moderate`: they identify cells only
 *   where nothing else does.
 * - **Focus not obscured** (2.4.11): the keyboard walks the focus across a grid with frozen panes and
 *   bars, and a focused cell covered at every one of its 25 sampled points inside the window is
 *   `focus-obscured`; a cell with no sampled point inside the window (off screen, or at most a sixth of
 *   it at the window's edge) is `focus-off-screen` (2.4.7).
 *
 * Each measure after the first starts from the catalog's state again (`resetState()`), and a measure
 * that could not be set up adds its reason to the record's problems and no criterion.
 *
 * The dark scheme is built with the same variant as the axe discovery run (`variants.ts`). Report-only:
 * a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

type Measure = 'cell-focus' | 'selection' | 'gridlines' | 'checkboxes' | 'icons' | 'menu-highlight' | 'control-focus' | 'obscured';

interface Plan {
  page: string;
  measures: Measure[];
  icons?: string[];
  controls?: string;
  // The cell ArrowRight starts from, when the catalog's cell has no cell to its right.
  focusFrom?: [number, number];
  // A column sorted through the API before the icons are measured: a header draws its sort arrow
  // (`.ht-sort-indicator`) only while its column is sorted.
  sort?: number;
}

// What each page is measured for. A page's state is the catalog's (a menu page is measured with its
// menu open).
const PLAN: Plan[] = [
  { page: 'grid', measures: ['cell-focus', 'selection', 'gridlines'] },
  { page: 'checkbox', measures: ['checkboxes', 'cell-focus'], focusFrom: [1, 0] },
  { page: 'shared-demo', measures: ['cell-focus', 'icons'], icons: ['.changeType', '.ht-sort-indicator'], sort: 1 },
  { page: 'context-menu', measures: ['menu-highlight'] },
  { page: 'dropdown-menu', measures: ['menu-highlight', 'checkboxes'] },
  { page: 'nested-rows', measures: ['icons'], icons: ['.ht_nestingButton'] },
  { page: 'collapsible-headers', measures: ['icons'], icons: ['.collapsibleIndicator'] },
  { page: 'autocomplete-editor', measures: ['icons'], icons: ['.htAutocompleteArrow'] },
  { page: 'pagination', measures: ['icons', 'control-focus'], icons: ['.ht-page-navigation-section__button'], controls: '.ht-pagination button:not([disabled]), .ht-pagination select' },
  { page: 'sheets-bar', measures: ['control-focus', 'icons'], icons: ['.ht-sheets-bar__add', '.ht-sheets-bar__all'], controls: '.ht-sheets-bar button, .ht-sheets-bar [role="tab"]' },
  { page: 'dialog', measures: ['control-focus'], controls: '.ht-dialog button' },
  { page: 'notification', measures: ['control-focus'], controls: '.ht-notification button' },
  { page: 'complex-demo', measures: ['obscured', 'cell-focus'] },
  { page: 'freeze-bar', measures: ['obscured'] },
];
const SCHEMES = ['light', 'dark'] as const;
// The criteria a measure evaluates, once it has measured something.
const MEASURE_CRITERIA: Record<Measure, string[]> = {
  'cell-focus': ['2.4.7', '1.4.11'],
  selection: ['1.4.11'],
  gridlines: ['1.4.11'],
  checkboxes: ['1.4.11'],
  icons: ['1.4.11'],
  'menu-highlight': ['2.4.7', '1.4.11'],
  'control-focus': ['2.4.7', '1.4.11'],
  obscured: ['2.4.11'],
};
// The keys the focus is walked with for 2.4.11, from the top-left cell: across the frozen panes and
// into the far corner and back.
const OBSCURE_WALK = ['PageDown', 'PageDown', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'End', 'ControlOrMeta+End', 'PageUp',
  'ControlOrMeta+Home', 'ArrowDown', 'Home'];
const MARGIN = 4;
// The margin around a control: room for an outline drawn 2 px off its edge, and for the colors next to it.
const CONTROL_MARGIN = 6;
// The margin around a part: wide enough that the pixels around it, past the row its edge shares, are its background.
const PART_MARGIN = 3;

type Box = { x: number; y: number; width: number; height: number };
type Image = { width: number; height: number; data: number[] };
type Result = { findings: EvidenceFinding[]; measured: unknown; skipped?: string };

/**
 * Captures an area of the page as RGBA pixels, decoded by the page's own canvas.
 *
 * @param page The page.
 * @param box The area, in viewport pixels.
 * @returns The image.
 */
async function capture(page: Page, box: Box): Promise<Image> {
  const viewport = page.viewportSize()!;
  const clip = {
    x: Math.max(0, Math.floor(box.x)),
    y: Math.max(0, Math.floor(box.y)),
    width: Math.max(1, Math.min(viewport.width, Math.ceil(box.x + box.width)) - Math.max(0, Math.floor(box.x))),
    height: Math.max(1, Math.min(viewport.height, Math.ceil(box.y + box.height)) - Math.max(0, Math.floor(box.y))),
  };
  const png = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });

  return page.evaluate(async(base64) => {
    const image = new Image();

    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');

    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d')!;

    context.drawImage(image, 0, 0);

    return { width: image.width, height: image.height, data: Array.from(context.getImageData(0, 0, image.width, image.height).data) };
  }, png.toString('base64'));
}

/**
 * The box of an element, grown by a margin on every side.
 *
 * @param box The box.
 * @param margin The margin.
 * @returns The grown box.
 */
function grow(box: Box, margin = MARGIN): Box {
  return { x: box.x - margin, y: box.y - margin, width: box.width + margin * 2, height: box.height + margin * 2 };
}

/**
 * Waits two animation frames, so a focus move, a selection and their transitions are painted.
 *
 * @param page The page.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/**
 * The master table's cell box at a coordinate.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param row The row.
 * @param col The column.
 * @returns The box, or `null` when the cell is not drawn.
 */
async function cellBox(page: Page, root: string, row: number, col: number): Promise<Box | null> {
  return page.evaluate(([selector, r, c]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
      { getCell(r: number, c: number, top?: boolean): HTMLElement | null } | undefined;
    const td = hot?.getCell(r, c, true);
    const rect = td?.getBoundingClientRect();

    return rect && rect.width > 0 ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  }, [root, row, col] as const);
}

/**
 * The focus indicator of a cell reached with ArrowRight from the page's cell.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell to start from.
 * @returns The findings and what was measured.
 */
async function measureCellFocus(page: Page, root: string, [row, col]: [number, number]): Promise<Result> {
  await selectCell(page, root, [row, col]);
  await settle(page);

  const box = await cellBox(page, root, row, col + 1);

  if (!box) {
    return { findings: [], measured: null, skipped: `the cell right of (${row}, ${col}) is not drawn` };
  }

  // Captured with nothing selected: the starting cell's ring reaches into the margin, and the pixels it
  // gives back when the focus moves on would count as a change.
  await page.evaluate(`(document.querySelector(${JSON.stringify(root)})?.querySelector('.ht-root-wrapper'))?.__hotInstance.deselectCell()`);
  await settle(page);

  const before = await capture(page, grow(box));

  await selectCell(page, root, [row, col]);
  await page.keyboard.press('ArrowRight');
  await settle(page);

  const change = indicatorChange(before, await capture(page, grow(box)), MARGIN);
  const step = `ArrowRight from (${row}, ${col})`;

  return {
    findings: focusFindings({ selector: 'td (a focused cell)', step, change }),
    measured: { ratio: change.adjacentRatio, againstReplaced: change.ratio, changed: change.changed },
  };
}

/**
 * The outline of a selected range: a strip across its bottom edge, before and after the selection.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The findings and what was measured.
 */
async function measureSelection(page: Page, root: string): Promise<Result> {
  const first = await cellBox(page, root, 1, 0);
  const last = await cellBox(page, root, 2, 1);

  if (!first || !last) {
    return { findings: [], measured: null, skipped: 'the range (1, 0) to (2, 1) is not drawn' };
  }

  const strip = { x: first.x + 8, y: last.y + last.height - 4, width: last.x + last.width - first.x - 16, height: 8 };
  const before = await capture(page, strip);

  expect(await page.evaluate(`(document.querySelector(${JSON.stringify(root)})?.querySelector('.ht-root-wrapper'))?.__hotInstance.selectCells([[1, 0, 2, 1]])`),
    'the range was selected').toBe(true);
  await settle(page);

  const change = indicatorChange(before, await capture(page, strip));
  const findings = change.changed === 0
    ? [{ kind: 'selection-not-visible', criteria: ['1.4.11'], severity: 'serious' as const, selector: '.wtBorder.area', step: 'select (1, 0) to (2, 1)',
      reason: 'Nothing changed at the edge of a selected range' }]
    : componentFindings({ kind: 'selection-contrast', selector: '.wtBorder.area', ratio: change.adjacentRatio, foreground: change.color!,
      background: change.adjacent ?? dominantColor(before), step: 'select (1, 0) to (2, 1)' });

  return { findings, measured: { ratio: change.adjacentRatio, againstReplaced: change.ratio } };
}

/**
 * The grid line between two cells: the strongest pixel of a strip across it, against the cells' color.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The findings and what was measured.
 */
async function measureGridlines(page: Page, root: string): Promise<Result> {
  await page.evaluate(`(document.querySelector(${JSON.stringify(root)})?.querySelector('.ht-root-wrapper'))?.__hotInstance.deselectCell()`);
  await settle(page);

  const left = await cellBox(page, root, 3, 0);

  if (!left) {
    return { findings: [], measured: null, skipped: 'the cell (3, 0) is not drawn' };
  }

  const image = await capture(page, { x: left.x + left.width - 3, y: left.y + 2, width: 6, height: Math.max(4, left.height - 4) });
  const background = dominantColor(image);
  const line = strongestPixel(image, background);

  if (!isDrawn(line)) {
    return { findings: [], measured: { drawn: false } };
  }

  return {
    findings: componentFindings({
      kind: 'gridline-contrast', selector: 'td (the border between two cells)', ratio: line.ratio, foreground: line.color, background,
      severity: 'moderate', reason: `The grid line stands ${floorRatio(line.ratio)}:1 from the cells; 1.4.11 asks for 3:1 where the line is what identifies a cell`,
    }),
    measured: { ratio: line.ratio },
  };
}

/**
 * Elements captured with a margin, measured from the pixels inside their box (`partContrast()`): an
 * icon against what it sits on, a checkbox's edge against the cell and a checked box's mark against
 * its fill.
 *
 * @param page The page.
 * @param selector The elements, inside the grid's root container and its portal.
 * @param kind The finding's kind.
 * @param root The root container selector.
 * @returns The findings and what was measured.
 */
async function measureParts(page: Page, selector: string, kind: string, root: string): Promise<Result> {
  const boxes = await page.evaluate(([css, rootSelector]) => [...document.querySelectorAll(`${rootSelector} ${css}, [data-a11y-scan-portal] ${css}`)]
    .map((node) => {
      const rect = node.getBoundingClientRect();
      const checked = (node as HTMLInputElement).checked;

      // A part another element covers at its center (an arrow under an open editor) is not what the user sees.
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      const onTop = !!top && (top === node || node.contains(top) || top.contains(node));
      // 1.4.11 exempts an inactive control: a disabled button is not measured.
      const disabled = (node as HTMLButtonElement).disabled === true || node.closest('[aria-disabled="true"], [disabled]') !== null;
      // A part the browser does not paint (`visibility: hidden`, opacity 0 on it or an ancestor) shows
      // nothing; a painted part is measured however faint it is.
      const painted = node.checkVisibility({ opacityProperty: true, visibilityProperty: true });

      return {
        x: rect.x, y: rect.y, width: rect.width, height: rect.height, visible: rect.width > 2 && rect.height > 2 && onTop && !disabled && painted,
        state: checked === undefined ? '' : (checked ? 'checked' : 'unchecked'),
      };
    })
    .filter(box => box.visible && box.y >= 0 && box.y + box.height <= innerHeight && box.x >= 0 && box.x + box.width <= innerWidth), [selector, root] as const);
  const findings: EvidenceFinding[] = [];
  const measured: Array<{ ratio: number; state: string }> = [];
  const seen = new Set<string>();

  if (boxes.length === 0) {
    return { findings: [], measured, skipped: `no visible, enabled part matches ${selector}` };
  }

  // Up to three of each state: a checked and an unchecked box are different parts.
  for (const box of boxes) {
    const key = box.state;

    if ([...seen].filter(item => item.startsWith(`${key}|`)).length >= 3) {
      continue;
    }
    seen.add(`${key}|${seen.size}`);

    const area = grow(box, PART_MARGIN);
    const image = await capture(page, area);
    // The part's box in the capture, in whole pixels: `capture()` clips from the floor of the area's corner.
    const inner = {
      x: Math.ceil(box.x) - Math.max(0, Math.floor(area.x)),
      y: Math.ceil(box.y) - Math.max(0, Math.floor(area.y)),
      width: Math.floor(box.x + box.width) - Math.ceil(box.x),
      height: Math.floor(box.y + box.height) - Math.ceil(box.y),
    };
    const part = partContrast(image, inner, kind === 'checkbox-contrast' ? { band: 2, mark: box.state === 'checked' } : {});

    measured.push({ ratio: part.ratio, state: box.state });
    findings.push(...componentFindings({
      kind, selector: `${selector}${box.state ? ` (${box.state})` : ''}`, ratio: part.ratio, foreground: part.color, background: part.background,
    }));
  }

  return { findings: dedupe(findings), measured };
}

/**
 * The highlight of an open menu, moved by ArrowDown onto an item: the item before and after.
 *
 * @param page The page.
 * @returns The findings and what was measured.
 */
async function measureMenuHighlight(page: Page): Promise<Result> {
  const box = await page.evaluate(() => {
    const menu = [...document.querySelectorAll('.htContextMenu, .htDropdownMenu')].find(node => node.getBoundingClientRect().width > 0);
    const cells = [...(menu?.querySelectorAll('.ht_master .htCore tbody td') ?? [])].filter(td => !td.classList.contains('htSeparator')
      && !td.classList.contains('htDisabled') && td.getBoundingClientRect().height > 0);
    const current = cells.findIndex(td => td.classList.contains('current'));
    // ArrowDown wraps from the last item to the first, as the menu's paginator does.
    const next = cells.length > 1 ? cells[(current + 1) % cells.length] : undefined;
    const rect = next?.getBoundingClientRect();

    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  });

  if (!box) {
    return { findings: [], measured: null, skipped: 'the open menu has no item to move to' };
  }

  const before = await capture(page, box);

  await page.keyboard.press('ArrowDown');
  await settle(page);

  const change = indicatorChange(before, await capture(page, box));

  // The highlight repaints the item itself, so it is judged against the item as it was.
  return {
    findings: focusFindings({ selector: 'td (a menu item)', step: 'ArrowDown in the open menu', change, against: 'before' }),
    measured: { ratio: change.ratio },
  };
}

/**
 * The focus indicator of each control of a bar, a dialog or a notification: the control before and
 * after it takes the focus right after a keyboard event, which is what makes `:focus-visible` match.
 *
 * @param page The page.
 * @param selector The controls.
 * @returns The findings and what was measured.
 */
async function measureControlFocus(page: Page, selector: string): Promise<Result> {
  const controls = page.locator(selector);
  const count = Math.min(await controls.count(), 6);
  const findings: EvidenceFinding[] = [];
  const measured: Array<{ control: string; ratio: number; againstReplaced: number; changed: number }> = [];

  for (let index = 0; index < count; index++) {
    const control = controls.nth(index);

    if (!(await control.isVisible())) {
      continue;
    }

    const box = await control.boundingBox();

    if (!box) {
      continue;
    }

    const label = await control.evaluate(node => `${node.tagName.toLowerCase()}.${[...node.classList].find(name => !/--|focus/.test(name)) ?? ''}`
      + `${node.getAttribute('aria-label') ? ` "${node.getAttribute('aria-label')}"` : (node.textContent?.trim() ? ` "${node.textContent.trim().slice(0, 20)}"` : '')}`);
    // Two controls can share a label (a notification's two "Action" buttons): each finding keeps its own id.
    const name = distinctName(label, measured.map(item => item.control));

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await settle(page);

    const before = await capture(page, grow(box, CONTROL_MARGIN));

    await page.keyboard.press('Shift');
    await control.focus();
    await settle(page);

    const change = indicatorChange(before, await capture(page, grow(box, CONTROL_MARGIN)), CONTROL_MARGIN);

    measured.push({ control: name, ratio: change.adjacentRatio, againstReplaced: change.ratio, changed: change.changed });
    findings.push(...focusFindings({ selector: name, step: 'a keyboard event, then the focus', change }));
  }

  return measured.length > 0 ? { findings, measured } : { findings, measured, skipped: `no visible control matches ${selector}` };
}

/**
 * Walks the focus across the grid with the keyboard and samples the focused cell after each key: a
 * cell covered at all 25 points (a frozen pane, a bar, an overlay over it) is obscured.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The findings and what was measured.
 */
async function measureObscured(page: Page, root: string): Promise<Result> {
  const findings: EvidenceFinding[] = [];
  const measured: Array<{ key: string; cell: number[] | null; visible: number; points: number }> = [];

  await selectCell(page, root, [0, 0]);
  for (const key of OBSCURE_WALK) {
    await page.keyboard.press(key);
    await settle(page);

    const sample = await page.evaluate((selector) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as {
        getSelectedRangeLast(): { highlight: { row: number; col: number } } | undefined;
        getCell(r: number, c: number, top?: boolean): HTMLElement | null;
      };
      const highlight = hot.getSelectedRangeLast()?.highlight;
      // The topmost copy of the cell: a frozen row or column is drawn by an overlay clone above the master.
      const td = highlight ? hot.getCell(highlight.row, highlight.col, true) : null;

      if (!td || !highlight) {
        return { cell: null, visible: 0, points: 0 };
      }

      const rect = td.getBoundingClientRect();
      let visible = 0;
      let points = 0;

      for (let ix = 1; ix <= 5; ix++) {
        for (let iy = 1; iy <= 5; iy++) {
          const x = rect.left + (rect.width * ix) / 6;
          const y = rect.top + (rect.height * iy) / 6;

          // A point outside the window is covered by nothing: it is not sampled.
          if (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) {
            const top = document.elementFromPoint(x, y);

            points += 1;

            const overlay = td.closest('.ht_master, [class*="ht_clone_"]');

            if (top && (top === td || td.contains(top) || (top.closest('.wtBorder') && top.closest('.ht_master, [class*="ht_clone_"]') === overlay))) {
              visible += 1;
            }
          }
        }
      }

      return { cell: [highlight.row, highlight.col], visible, points };
    }, root);

    measured.push({ key, cell: sample.cell, visible: sample.visible, points: sample.points });
    if (sample.cell) {
      findings.push(...obscuredFindings({ selector: `td (${sample.cell.join(', ')})`, step: `${key} in the walk`, visible: sample.visible, points: sample.points }));
    }
  }

  // Two keys can land on one cell (`Home` after `ArrowDown` from the first column): one finding per cell.
  return measured.some(item => item.cell)
    ? { findings: dedupe(findings), measured }
    : { findings: [], measured, skipped: 'no cell held the focus during the walk' };
}

/**
 * Puts a page whose catalog state is `none` back as it loaded, before the next measure: no selection,
 * no focus, the grid and the window scrolled to the top-left. A page whose state is a menu or an editor
 * keeps it, because that state is what it is measured in.
 *
 * @param page The page.
 * @param entry The catalog entry.
 * @param root The root container selector.
 */
async function resetState(page: Page, entry: A11yPage, root: string): Promise<void> {
  if (entry.state !== 'none') {
    return;
  }
  await page.evaluate((selector) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
      { deselectCell(): void; scrollViewportTo(options: { row: number; col: number }): boolean } | undefined;

    hot?.deselectCell();
    hot?.scrollViewportTo({ row: 0, col: 0 });
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  }, root);
  await page.mouse.move(0, 0);
  await settle(page);
}

/**
 * Sorts a column through the API, so its header draws the sort arrow.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param column The visual column.
 */
async function sortColumn(page: Page, root: string, column: number): Promise<void> {
  const sorted = await page.evaluate(([selector, col]) => {
    type Sorting = { enabled: boolean; sort(config: { column: number; sortOrder: 'asc' }): void; isSorted(): boolean };
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance as unknown as
      { getPlugin(name: string): Sorting | undefined } | undefined;
    const plugin = ['multiColumnSorting', 'columnSorting'].map(name => hot?.getPlugin(name)).find(item => item?.enabled);

    plugin?.sort({ column: col, sortOrder: 'asc' });

    return plugin?.isSorted() ?? false;
  }, [root, column] as const);

  expect(sorted, `column ${column} is sorted, so its header draws the sort arrow`).toBe(true);
  // Every overlay that draws the header gets an arrow; the master's copy comes first and is hidden, so
  // wait for the one drawn.
  await expect(page.locator(`${root} .ht-sort-indicator`).filter({ visible: true }).first()).toBeVisible();
}

/**
 * One finding per kind and element.
 *
 * @param findings The findings.
 * @returns The findings, the first of each kind and element.
 */
function dedupe(findings: EvidenceFinding[]): EvidenceFinding[] {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.kind}|${finding.selector}`;

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    return true;
  });
}

/**
 * Measures one page in one theme and scheme.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 * @param plan What to measure.
 * @param theme The theme.
 * @param scheme The scheme.
 */
async function measure(page: Page, testInfo: TestInfo, entry: A11yPage, plan: Plan, theme: string, scheme: typeof SCHEMES[number]) {
  const startedAt = Date.now();
  const variant = scheme === 'dark' ? 'dark' : null;
  const target = { page: entry.id, theme, state: entry.state, variant, url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);
  if (scheme === 'dark') {
    await installDarkScheme(page);
  }

  const opened = await openTarget(page, entry, theme);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);
  // The pointer rests outside the grid, so no hover state is captured.
  await page.mouse.move(0, 0);

  const environment = await readEnvironment(page);

  // A dark record of a page the dark class never reached would be a second light measurement.
  if (scheme === 'dark' && !(await darkSchemeApplied(page, opened.root))) {
    await attachEvidence(testInfo, {
      target, startedAt, environment, findings: [], criteria: [], detail: { variantApplied: false },
      problems: ['the dark scheme did not apply: the grid carries no ht-theme-<name>-dark class, so nothing was measured'],
      pageErrors: opened.pageErrors,
    });

    return;
  }

  const findings: EvidenceFinding[] = [];
  const detail: Record<string, unknown> = scheme === 'dark' ? { variantApplied: true } : {};
  const criteria = new Set<string>();
  const problems: string[] = [];

  for (const [index, name] of plan.measures.entries()) {
    if (index > 0) {
      await resetState(page, entry, opened.root);
    }

    let result: Result;

    switch (name) {
      case 'cell-focus':
        result = await measureCellFocus(page, opened.root, plan.focusFrom ?? opened.cell);
        break;
      case 'selection':
        result = await measureSelection(page, opened.root);
        break;
      case 'gridlines':
        result = await measureGridlines(page, opened.root);
        break;
      case 'checkboxes':
        result = await measureParts(page, 'input[type="checkbox"]', 'checkbox-contrast', opened.root);
        break;
      case 'icons': {
        if (plan.sort !== undefined) {
          await sortColumn(page, opened.root, plan.sort);
        }

        const all = await Promise.all((plan.icons ?? []).map(selector => measureParts(page, selector, 'icon-contrast', opened.root)));
        const missing = all.flatMap(item => (item.skipped ? [item.skipped] : []));

        // A selector of the plan that matches nothing is a problem even when another one measured.
        if (missing.length < all.length) {
          problems.push(...missing.map(reason => `icons: ${reason}`));
        }
        result = {
          findings: all.flatMap(item => item.findings),
          measured: all.map((item, position) => ({ selector: plan.icons![position], ...(item.skipped ? { skipped: item.skipped } : { parts: item.measured }) })),
          ...(missing.length === all.length ? { skipped: missing.join('; ') } : {}),
        };
        break;
      }
      case 'menu-highlight':
        result = await measureMenuHighlight(page);
        break;
      case 'control-focus':
        result = await measureControlFocus(page, plan.controls!);
        break;
      case 'obscured':
        result = await measureObscured(page, opened.root);
        break;
    }
    findings.push(...result.findings);
    // A measure that could not be set up evaluated nothing: its criteria stay off the record, and its
    // reason is a problem of the record, never a pass.
    if (result.skipped) {
      problems.push(`${name}: ${result.skipped}`);
      detail[name] = { skipped: result.skipped };
    } else {
      MEASURE_CRITERIA[name].forEach(id => criteria.add(id));
      detail[name] = result.measured;
    }
  }

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, criteria: FOCUS_CRITERIA.filter(id => criteria.has(id)), detail, problems,
    pageErrors: opened.pageErrors,
  });
}

for (const theme of A11Y_THEMES) {
  for (const scheme of SCHEMES) {
    for (const plan of PLAN) {
      const entry = A11Y_PAGES.find(item => item.id === plan.page)!;
      const title = `measure ${plan.page} on ${theme}${scheme === 'dark' ? ' (dark)' : ''}`;
      const body = async({ page }: { page: Page }, testInfo: TestInfo) => measure(page, testInfo, entry, plan, theme, scheme);

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
  }
}
