import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { CustomBordersLabPage } from '../fixtures/pages/CustomBordersLabPage';
import { CustomBordersDemoPage } from '../fixtures/pages/CustomBordersDemoPage';

const GREEN_BORDER = { color: 'green', width: 1 };
const RED_BORDER = { color: 'red', width: 2 };
// The range-level colors #548235 / #C6E0B4 as the DOM reports them.
const DARK_GREEN_RGB = 'rgb(84, 130, 53)';
const LIGHT_GREEN_RGB = 'rgb(198, 224, 180)';

/**
 * Open the lab fixture, which lets each test create the exact grid it needs.
 */
async function gotoLab(page: Page, theme: string, bundle: string): Promise<CustomBordersLabPage> {
  const lab = new CustomBordersLabPage(page, theme, bundle);

  await lab.goto();

  return lab;
}

/**
 * Open the static frozen-areas fixture. Its specs cover the CustomBorders viewport working set:
 * the border DOM (`.wtBorder` divs) is created per overlay by the selection manager, so the
 * assertions ask the page object which overlay a border landed in. Visible border edges carry
 * inline sizes; hidden ones are `display: none`, which the `:visible` filter excludes.
 */
async function gotoDemo(page: Page, theme: string, bundle: string): Promise<CustomBordersDemoPage> {
  const demo = new CustomBordersDemoPage(page, theme, bundle);

  await demo.goto();

  return demo;
}

test.describe('CustomBorders with frozen rows and columns', () => {
  test('renders borders located in the frozen areas', async ({ page, theme, bundle }) => {
    const demo = await gotoDemo(page, theme, bundle);

    // (0,0) lives in every frozen overlay; (10,0) in inline-start; (0,10) in top.
    await expect(demo.borderIn('corner')).toBeVisible();
    await expect(demo.borderIn('inlineStart')).toBeVisible();
    await expect(demo.borderIn('top')).toBeVisible();
    // (10,10) is in the master viewport.
    await expect(demo.borderIn('master')).toBeVisible();
  });

  test('keeps the frozen column border rendered after scrolling far right', async ({ page, theme, bundle }) => {
    const demo = await gotoDemo(page, theme, bundle);

    // Scrolling only the column axis leaves the master row window unchanged, so (10, 0)'s row
    // stays rendered - isolating whether the frozen-start column keeps its border once the
    // master column range moves past col 0. Scrolled far enough (col 90 of 100) that col 10 is
    // out of the master range on every theme.
    await demo.scrollViewportTo({ col: 90 });
    // The frozen column keeps its border even though the master range excludes col 0.
    await expect(demo.borderIn('inlineStart')).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its column scrolled out - its selection must be
    // culled (virtualization intact). `expect.poll` (rather than a single read) tolerates the
    // render/cleanup happening a tick after `scrollViewportTo` resolves.
    await expect.poll(() => demo.hasRenderedBorder(10, 10)).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => demo.hasRenderedBorder(10, 0)).toBe(true);
  });

  test('keeps the frozen row border rendered after scrolling far down', async ({ page, theme, bundle }) => {
    const demo = await gotoDemo(page, theme, bundle);

    // Scrolling only the row axis leaves the master column window unchanged, so (0, 10)'s column
    // stays rendered - isolating whether the frozen-top row keeps its border once the master row
    // range moves past row 0. Scrolled far enough (row 45 of 50) that row 10 is out of the master
    // range on every theme.
    await demo.scrollViewportTo({ row: 45 });
    // The frozen row keeps its border even though the master range excludes row 0.
    await expect(demo.borderIn('top')).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its row scrolled out - its selection must be
    // culled (virtualization intact).
    await expect.poll(() => demo.hasRenderedBorder(10, 10)).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => demo.hasRenderedBorder(0, 10)).toBe(true);
  });
});

test.describe('CustomBorders and UndoRedo', () => {
  test('restores a border removed together with its row when the removal is undone', async ({ page, theme, bundle }) => {
    const demo = await gotoDemo(page, theme, bundle);

    await demo.alter('remove_row', 10);

    expect(await demo.modelHasBorder(10, 0)).toBe(false);

    await demo.undo();

    // The border meta is restored asynchronously after the undone row comes back; poll on the
    // plugin model instead of a fixed-time wait.
    await expect.poll(() => demo.modelHasBorder(10, 0)).toBe(true);
    expect(await demo.cellHasBordersMeta(10, 0)).toBe(true);
  });
});

test.describe('CustomBorders selection ownership', () => {
  test('clearBorders() keeps custom selections the plugin does not own', async ({ page, theme, bundle }) => {
    const demo = await gotoDemo(page, theme, bundle);

    await demo.addForeignCustomSelection(5, 5);

    // The plugin owned at least one selection alongside the foreign one, so the clear had
    // plugin-owned DOM to remove - without this the test would pass vacuously.
    expect(await demo.customSelectionCount()).toBeGreaterThanOrEqual(2);

    await demo.clearBorders();

    // Only the foreign selection must survive the plugin's clear.
    expect(await demo.customSelectionCount()).toBe(1);
  });
});

test.describe('CustomBorders structural changes (issues #11031, #6063, #3296)', () => {
  test('moves a border down when a row is inserted above it', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    expect((await lab.cellBorders(3, 0))?.top).toEqual(GREEN_BORDER);

    await lab.alter('insert_row_above', 1, 1);

    // The border follows the cell it was applied to: the plugin's own bookkeeping and the
    // cell meta agree that it now lives on row 4 (getBorders() drives the rendered selection).
    expect(await lab.borderCoords()).toEqual([{ row: 4, col: 0 }]);
    expect((await lab.cellBorders(4, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.cellBorders(3, 0)).toBeNull();
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('moves a border down by the inserted amount for a multi-row insert', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('insert_row_above', 1, 3);

    expect(await lab.borderCoords()).toEqual([{ row: 6, col: 0 }]);
    expect((await lab.cellBorders(6, 0))?.top).toEqual(GREEN_BORDER);
    // The lab fixture pins the grid dimensions, so row 6 is rendered on every theme and the
    // border must be materialized (virtualization keeps in-viewport borders in the DOM).
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps a border in place when a row is inserted below it at its own index', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    // `insert_row_below` at the border's own row inserts at visual index 4 - the bordered row
    // itself must not shift (regression guard for the `>=` insertion semantics wiring).
    await lab.alter('insert_row_below', 3, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 3, col: 0 }]);
    expect((await lab.cellBorders(3, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('moves a border up when a row above it is removed', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('remove_row', 1, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 2, col: 0 }]);
    expect((await lab.cellBorders(2, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('drops a border when its own row is removed', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('remove_row', 3, 1);

    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.cellBorders(3, 0)).toBeNull();
    expect(await lab.countVisibleCustomBorders()).toBe(0);
    expect(await lab.countCustomBorders()).toBe(0);
  });

  test('moves a border right when a column is inserted before it', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('insert_col_start', 1, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 0, col: 4 }]);
    expect((await lab.cellBorders(0, 4))?.start).toEqual(RED_BORDER);
    expect(await lab.cellBorders(0, 3)).toBeNull();
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('moves a border right by the inserted amount for a multi-column insert', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('insert_col_start', 1, 2);

    expect(await lab.borderCoords()).toEqual([{ row: 0, col: 5 }]);
    expect((await lab.cellBorders(0, 5))?.start).toEqual(RED_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps a border in place when a column is inserted after it at its own index', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    // `insert_col_end` at the border's own column inserts at visual index 4 - the bordered
    // column itself must not shift.
    await lab.alter('insert_col_end', 3, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 0, col: 3 }]);
    expect((await lab.cellBorders(0, 3))?.start).toEqual(RED_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('drops a border when its own column is removed', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('remove_col', 3, 1);

    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.cellBorders(0, 3)).toBeNull();
    expect(await lab.countVisibleCustomBorders()).toBe(0);
    expect(await lab.countCustomBorders()).toBe(0);
  });

  test('repaints the column headers after a column insert', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3,
      dataCols: 5,
      colHeaders: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('insert_col_start', 1, 1);

    // The insert splices a `null` into `colHeaders` at index 1, so the new column falls back to
    // its spreadsheet letter and every later label shifts one column right. A header row the
    // plugin's structural resync left stale keeps the pre-insert labels and appends the extra
    // column at the end instead - which silently rebinds every label to the wrong column, so a
    // click on "Beta" would select the column that now renders "B".
    expect(await lab.renderedColumnHeaders()).toEqual(['Alpha', 'B', 'Beta', 'Gamma', 'Delta', 'Epsilon']);
    expect(await lab.renderedColumnHeaders()).toEqual(await lab.apiColumnHeaders());
  });

  test('repaints the column headers after a column removal', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3,
      dataCols: 5,
      colHeaders: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('remove_col', 1, 1);

    expect(await lab.renderedColumnHeaders()).toEqual(['Alpha', 'Gamma', 'Delta', 'Epsilon']);
    expect(await lab.renderedColumnHeaders()).toEqual(await lab.apiColumnHeaders());
  });

  test('lets the context menu remove a border after it was shifted by a row insert (orphaned id)', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      contextMenu: true,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('insert_row_above', 1, 1);

    // The border now lives on row 4. Before the fix its id still encoded row 3, so removing it
    // from the cell it visually belongs to left the rendered border orphaned.
    await lab.removeBorderViaContextMenu(4, 0);

    expect(await lab.cellBorders(4, 0)).toBeNull();
    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.countVisibleCustomBorders()).toBe(0);
    expect(await lab.countCustomBorders()).toBe(0);
  });

  test('keeps a border on its cell when the row is moved with manualRowMove', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      manualRowMove: true,
      customBorders: [{ row: 1, col: 0, top: GREEN_BORDER }],
    });

    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('manualRowMove').moveRow(1, 3);
      hot.render();
    });

    expect(await lab.borderCoords()).toEqual([{ row: 3, col: 0 }]);
    expect((await lab.cellBorders(3, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps borders on their data cells when multiple rows are moved in one batch', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      manualRowMove: true,
      customBorders: [
        { row: 1, col: 0, top: GREEN_BORDER },
        { row: 4, col: 0, top: RED_BORDER },
      ],
    });

    // Anchor each border to its cell's data, so the assertion is independent of how the batch
    // move renumbers the visual indexes.
    const greenValue = await lab.dataAtCell(1, 0);
    const redValue = await lab.dataAtCell(4, 0);

    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('manualRowMove').moveRows([1, 2], 3);
      hot.render();
    });

    const coords = await lab.borderCoords();

    expect(coords.length).toBe(2);

    for (const coord of coords) {
      const borders = await lab.cellBorders(coord.row, coord.col);
      const value = await lab.dataAtCell(coord.row, coord.col);

      // Each border still marks the same underlying data cell it was applied to.
      if (borders?.top?.color === GREEN_BORDER.color) {
        expect(value).toBe(greenValue);
      } else {
        expect(borders?.top).toEqual(RED_BORDER);
        expect(value).toBe(redValue);
      }
    }
  });

  test('keeps a border on its cell when the column is moved with manualColumnMove', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      manualColumnMove: true,
      customBorders: [{ row: 0, col: 1, start: RED_BORDER }],
    });

    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('manualColumnMove').moveColumn(1, 3);
      hot.render();
    });

    expect(await lab.borderCoords()).toEqual([{ row: 0, col: 3 }]);
    expect((await lab.cellBorders(0, 3))?.start).toEqual(RED_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('moves a border back on undo of a row insert and forward again on redo', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('insert_row_above', 1, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 4, col: 0 }]);

    await page.evaluate(() => (window as any).hot.getPlugin('undoRedo').undo());

    // Undoing the insert removes the inserted row, so the border shifts back to its origin.
    await expect.poll(() => lab.borderCoords()).toEqual([{ row: 3, col: 0 }]);
    expect((await lab.cellBorders(3, 0))?.top).toEqual(GREEN_BORDER);

    await page.evaluate(() => (window as any).hot.getPlugin('undoRedo').redo());

    await expect.poll(() => lab.borderCoords()).toEqual([{ row: 4, col: 0 }]);
    expect((await lab.cellBorders(4, 0))?.top).toEqual(GREEN_BORDER);
  });

  test('keeps the range border edges aligned across corner and middle cells after an insert', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 10, dataCols: 6,
      customBorders: [{
        range: { from: { row: 3, col: 1 }, to: { row: 6, col: 4 } },
        border: { width: 2, color: '#548235' },
        top: {},
        bottom: {},
        start: {},
        end: {},
      }],
    });

    await lab.alter('insert_row_above', 1, 1); // the range shifts down to rows 4-7

    // The top edge must stay one straight line: the horizontal border over the top-left corner
    // cell and over a top middle cell must sit at the same Y. Regression for an id collision
    // that destroyed the freshly shifted corner selections, dropping their horizontal edge.
    const cornerCell = await lab.cellRect(4, 1);
    const cornerTop = await lab.horizontalEdgeTop(4, 1, DARK_GREEN_RGB, 'top');
    const middleTop = await lab.horizontalEdgeTop(4, 2, DARK_GREEN_RGB, 'top');

    // The corner's top border sits at the corner cell's top edge...
    expect(Math.abs(cornerTop - cornerCell.top)).toBeLessThanOrEqual(2);
    // ...and it is level with the middle cell's top border (one continuous line).
    expect(Math.abs(cornerTop - middleTop)).toBeLessThanOrEqual(1);
  });

  test('keeps a border on its data cell when a row is inserted with trimmed rows active', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 6, dataCols: 3,
      trimRows: [2], // a trimmed physical row sits next to the insertion point
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    // Identify the bordered cell by its data, so the assertion holds regardless of the
    // non-contiguous visual/physical mapping that trimming introduces.
    const borderedValue = await lab.dataAtCell(3, 0);

    await lab.alter('insert_row_above', 2, 1);

    const [border] = await lab.borderCoords();

    // The border still marks the same underlying data cell - the shift did not drift away from it.
    expect(await lab.dataAtCell(border.row, 0)).toBe(borderedValue);
    expect((await lab.cellBorders(border.row, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps a border on its data cell when a row is removed with trimmed rows active', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 6, dataCols: 3,
      trimRows: [1],
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    const borderedValue = await lab.dataAtCell(3, 0);

    await lab.alter('remove_row', 1, 1);

    const [border] = await lab.borderCoords();

    expect(await lab.dataAtCell(border.row, 0)).toBe(borderedValue);
    expect((await lab.cellBorders(border.row, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps a border on its data cell when a row is inserted with hidden rows active', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 6, dataCols: 3,
      hiddenRows: { rows: [2] },
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    const borderedValue = await lab.dataAtCell(3, 0);

    await lab.alter('insert_row_above', 1, 1);

    const [border] = await lab.borderCoords();

    expect(await lab.dataAtCell(border.row, 0)).toBe(borderedValue);
    expect((await lab.cellBorders(border.row, 0))?.top).toEqual(GREEN_BORDER);
  });
});

test.describe('CustomBorders range with a `border` object (issue #6679)', () => {
  test('applies the range-level `border` style to empty sides instead of the default', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 5,
      customBorders: [{
        range: { from: { row: 1, col: 1 }, to: { row: 3, col: 3 } },
        border: { width: 2, color: '#548235' },
        top: {},
        bottom: {},
        start: {},
        end: {},
      }],
    });

    // The empty `{}` sides inherit the range-level `border` width and color, not the 1px
    // black default.
    expect((await lab.cellBorders(1, 1))?.top).toEqual({ width: 2, color: '#548235' });
    expect((await lab.cellBorders(1, 1))?.start).toEqual({ width: 2, color: '#548235' });
    expect((await lab.cellBorders(3, 3))?.bottom).toEqual({ width: 2, color: '#548235' });
    expect((await lab.cellBorders(3, 3))?.end).toEqual({ width: 2, color: '#548235' });

    // The border renders with the configured color instead of the default black.
    const colors = await lab.visibleBorderColors();

    expect(colors).toContain(DARK_GREEN_RGB);
    expect(colors).not.toContain('rgb(0, 0, 0)');
  });

  test('keeps the borders from both ranges where two ranges overlap', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 6, dataCols: 6,
      customBorders: [
        {
          range: { from: { row: 1, col: 1 }, to: { row: 2, col: 3 } },
          border: { width: 2, color: '#C6E0B4' },
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
        {
          range: { from: { row: 2, col: 1 }, to: { row: 3, col: 3 } },
          border: { width: 2, color: '#548235' },
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
      ],
    });

    // Cell (2, 2) is the bottom edge of the first range and the top edge of the second range.
    // Both sides must survive, each carrying its own range color.
    const borders = await lab.cellBorders(2, 2);

    expect(borders?.top).toEqual({ width: 2, color: '#548235' });
    expect(borders?.bottom).toEqual({ width: 2, color: '#C6E0B4' });

    // Both range colors render, so the overlapping range is not swallowed by the topmost one.
    const colors = await lab.visibleBorderColors();

    expect(colors).toContain(LIGHT_GREEN_RGB);
    expect(colors).toContain(DARK_GREEN_RGB);
  });

  test('aligns edges and stacks deterministically where ranges of different widths overlap', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 8, dataCols: 8,
      customBorders: [
        {
          range: { from: { row: 1, col: 1 }, to: { row: 3, col: 5 } },
          border: { width: 2, color: '#C6E0B4' }, // thin light range
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
        {
          range: { from: { row: 3, col: 3 }, to: { row: 5, col: 7 } },
          border: { width: 3, color: '#548235' }, // thick dark range, overlaps at (3, 3..5)
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
      ],
    });

    // The light range's bottom edge (row 3) runs across cells that are, at col 3, also the dark
    // range's left edge. The horizontal light line must stay level: the crossing cell must not
    // be nudged 1px by the thicker range's width (regression for the shared-delta positioning).
    const lightBottomAtCrossing = await lab.horizontalEdgeTop(3, 3, LIGHT_GREEN_RGB, 'bottom');
    const lightBottomBeside = await lab.horizontalEdgeTop(3, 2, LIGHT_GREEN_RGB, 'bottom');

    expect(Math.round(lightBottomAtCrossing)).toBe(Math.round(lightBottomBeside));

    // The thicker (dark) edge stacks above the thinner (light) one, so overlaps are consistent
    // regardless of creation order. Stacking is per edge element (by its own width), so a single
    // visual line keeps one z-index even where it crosses a shared cell.
    expect(await lab.zIndexOfColor(DARK_GREEN_RGB)).toBeGreaterThan(await lab.zIndexOfColor(LIGHT_GREEN_RGB));

    // At the corner (3, 5) the dark range's thick top edge meets the light range's thinner right
    // edge. The horizontal edge must reach, but not overshoot, the vertical one - its length is
    // extended by the perpendicular edge's width, not its own.
    expect(Math.round(await lab.outerRightNear(3, 5, DARK_GREEN_RGB, true)))
      .toBeLessThanOrEqual(Math.round(await lab.outerRightNear(3, 5, LIGHT_GREEN_RGB, false)));
  });

  test('does not leave a border edge sticking out into a column inserted inside a range', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 8, dataCols: 10,
      customBorders: [{
        range: { from: { row: 2, col: 2 }, to: { row: 5, col: 6 } },
        border: { width: 3, color: '#548235' },
        top: {},
        bottom: {},
        start: {},
        end: {},
      }],
    });

    // Insert a new, border-less column inside the range - it splits the range's horizontal edges.
    await lab.alter('insert_col_start', 4, 1);

    // The cell just left of the new column (col 3) has no right border there (its `end` is
    // hidden), so its bottom edge must stay within the cell and not extend into the empty
    // inserted column.
    const leftCell = await lab.cellRect(5, 3);
    const bottomEdgeRight = await lab.bottomEdgeOuterRight(5, 3, DARK_GREEN_RGB);

    expect(Math.round(bottomEdgeRight)).toBeLessThanOrEqual(Math.round(leftCell.right));
  });
});

test.describe('CustomBorders range borders in RTL (issue #6679)', () => {
  test('aligns edges and stacks deterministically where ranges of different widths overlap', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 8, dataCols: 8,
      layoutDirection: 'rtl',
      customBorders: [
        {
          range: { from: { row: 1, col: 1 }, to: { row: 3, col: 5 } },
          border: { width: 2, color: '#C6E0B4' }, // thin light range
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
        {
          range: { from: { row: 3, col: 3 }, to: { row: 5, col: 7 } },
          border: { width: 3, color: '#548235' }, // thick dark range, overlaps at (3, 3..5)
          top: {},
          bottom: {},
          start: {},
          end: {},
        },
      ],
    });

    // The light range's bottom edge must stay level across the cell it shares with the thicker
    // dark range - the same guarantee as in LTR, on the mirrored layout.
    const lightBottomAtCrossing = await lab.horizontalEdgeTop(3, 3, LIGHT_GREEN_RGB, 'bottom');
    const lightBottomBeside = await lab.horizontalEdgeTop(3, 2, LIGHT_GREEN_RGB, 'bottom');

    expect(Math.round(lightBottomAtCrossing)).toBe(Math.round(lightBottomBeside));

    // The thicker edge still stacks above the thinner one in RTL.
    expect(await lab.zIndexOfColor(DARK_GREEN_RGB)).toBeGreaterThan(await lab.zIndexOfColor(LIGHT_GREEN_RGB));

    // At the corner (3, 5) the dark range's thick top edge meets the light range's thinner end
    // edge. In RTL the inline-start axis runs right-to-left, so the corner sits on the cell's
    // LEFT side: the horizontal edge must reach, but not overshoot (stick out past), the
    // vertical one - mirrored from the LTR assertion.
    expect(Math.round(await lab.outerLeftNear(3, 5, DARK_GREEN_RGB, true)))
      .toBeGreaterThanOrEqual(Math.round(await lab.outerLeftNear(3, 5, LIGHT_GREEN_RGB, false)));
  });

  test('does not leave a border edge sticking out into a column inserted inside a range', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 8, dataCols: 10,
      layoutDirection: 'rtl',
      customBorders: [{
        range: { from: { row: 2, col: 2 }, to: { row: 5, col: 6 } },
        border: { width: 3, color: '#548235' },
        top: {},
        bottom: {},
        start: {},
        end: {},
      }],
    });

    // Insert a new, border-less column inside the range - it splits the range's horizontal edges.
    await lab.alter('insert_col_start', 4, 1);

    // The cell at col 3 has its `end` side hidden at the split. In RTL the inserted column sits
    // visually to the LEFT of that cell, so its bottom edge must not extend leftwards past the
    // cell into the empty inserted column - the mirror of the LTR assertion.
    const splitCell = await lab.cellRect(5, 3);
    const bottomEdgeLeft = await lab.bottomEdgeOuterLeft(5, 3, DARK_GREEN_RGB);

    expect(Math.round(bottomEdgeLeft)).toBeGreaterThanOrEqual(Math.round(splitCell.left));
  });
});

test.describe('CustomBorders external cell-meta writes', () => {
  test('syncs a user-authored partial borders meta write into the model and renders it', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 5,
      customBorders: true,
    });

    // A direct `setCellMeta` write carries none of the plugin's internal bookkeeping fields
    // (`id`/`row`/`col`) - it must still be picked up by the border model and rendered.
    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.setCellMeta(2, 2, 'borders', { top: { width: 2, color: 'red' } });
      hot.render();
    });

    expect(await lab.borderCoords()).toEqual([{ row: 2, col: 2 }]);
    expect((await lab.cellBorders(2, 2))?.top).toEqual({ width: 2, color: 'red' });
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('replaces the cell borders with the written value (meta write semantics)', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 5,
      customBorders: [{ row: 2, col: 2, top: GREEN_BORDER }],
    });

    // `setCellMeta` replaces the `borders` key, so the write defines the cell's borders: the
    // mentioned side is applied and the previous (unmentioned) sides are gone - model and
    // rendering must follow the meta.
    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.setCellMeta(2, 2, 'borders', { start: { width: 2, color: 'red' } });
      hot.render();
    });

    const borders = await lab.cellBorders(2, 2);

    expect(borders?.start).toEqual({ width: 2, color: 'red' });
    expect(borders?.top).toEqual({ hide: true });
    expect(await lab.borderCoords()).toEqual([{ row: 2, col: 2 }]);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('clears the model entry when a meta write leaves no visible side', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 5,
      customBorders: [{ row: 2, col: 2, top: GREEN_BORDER }],
    });

    expect(await lab.countVisibleCustomBorders()).toBe(1);

    // Hiding the only visible side describes a border-less cell: the model entry and the meta
    // are dropped, mirroring the plugin's own clear semantics.
    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.setCellMeta(2, 2, 'borders', { top: { hide: true } });
      hot.render();
    });

    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.cellBorders(2, 2)).toBeNull();
    expect(await lab.countVisibleCustomBorders()).toBe(0);
    expect(await lab.countCustomBorders()).toBe(0);
  });
});

test.describe('CustomBorders border DOM working set', () => {
  test('does not materialize custom border DOM in header-only overlays', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 5, dataCols: 5,
      colHeaders: true,
      rowHeaders: true,
      customBorders: [{ row: 1, col: 1, top: GREEN_BORDER }],
    });

    // Without frozen rows/columns the clone overlays render headers only - no cell of the
    // bordered range exists in them, so the culling early-out must keep them free of border
    // DOM instead of materializing redundant copies.
    expect(await lab.countCustomBordersIn('.ht_master')).toBeGreaterThan(0);
    expect(await lab.countCustomBordersIn('.ht_clone_top')).toBe(0);
    expect(await lab.countCustomBordersIn('.ht_clone_inline_start')).toBe(0);
    expect(await lab.countCustomBordersIn('.ht_clone_top_inline_start_corner')).toBe(0);
  });

  test('materializes a border again when its hidden row is shown', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 6, dataCols: 3,
      hiddenRows: { rows: [3] },
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    // A border on a hidden row has a null cell range - nothing to draw, and nothing may throw.
    expect(await lab.countVisibleCustomBorders()).toBe(0);

    await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('hiddenRows').showRows([3]);
      hot.render();
    });

    // Once the row is shown its border joins the working set and renders.
    expect(await lab.countVisibleCustomBorders()).toBe(1);
    expect((await lab.cellBorders(3, 0))?.top).toEqual(GREEN_BORDER);
  });
});

test.describe('CustomBorders progressive application (customBordersProgressive)', () => {
  /**
   * Border config entries for rows 0..rows-1, col 0.
   */
  function bordersForRows(rows: number): Array<Record<string, unknown>> {
    return Array.from({ length: rows }, (_, row) => ({ row, col: 0, top: GREEN_BORDER }));
  }

  /**
   * Resolve after three chained 0ms macrotasks in the page. Progressive batches are scheduled
   * on 0ms timeouts, so any pending (stale) batch is guaranteed to have fired before this
   * resolves - a scheduling barrier for negative assertions, not a duration wait.
   */
  async function macrotaskBarrier(page: Page): Promise<void> {
    await page.evaluate(() => new Promise((resolve) => {
      setTimeout(() => setTimeout(() => setTimeout(resolve, 0), 0), 0);
    }));
  }

  test('fires afterCustomBordersUpdate synchronously when progressive is disabled (default)', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    const modelSizeAtInit = await lab.createGrid({
      dataRows: 4, dataCols: 4,
      customBorders: [{ row: 1, col: 1, top: GREEN_BORDER }],
    });

    // Default (synchronous) path: borders are applied and the hook has fired by the time init
    // returns.
    expect(modelSizeAtInit).toBe(1);
    expect(await lab.bordersUpdateCount()).toBeGreaterThanOrEqual(1);
    expect((await lab.cellBorders(1, 1))?.top).toEqual(GREEN_BORDER);
  });

  test('defers border application and applies it in the background when enabled', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    const modelSizeAtInit = await lab.createGrid({
      dataRows: 20, dataCols: 4,
      customBorders: bordersForRows(20),
      customBordersProgressive: { chunkSize: 5 },
    });

    // Right after init the grid is rendered but the borders have NOT been applied yet - they
    // are queued for background batches, so init did not block on building them.
    expect(modelSizeAtInit).toBe(0);

    // Once the queue drains, the completion hook fires exactly once and the full configuration
    // is applied - identical to the synchronous path.
    await expect.poll(() => lab.bordersUpdateCount()).toBe(1);
    // The poll resolves the instant the counter reaches 1, which alone would not catch a second
    // fire a macrotask later. Re-read past the batch timers to make "exactly once" an assertion
    // rather than a claim.
    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(1);
    expect((await lab.borderCoords()).length).toBe(20);
    expect((await lab.cellBorders(0, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBeGreaterThan(0);
  });

  test('defers border application with the plain boolean `true` form', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    const modelSizeAtInit = await lab.createGrid({
      dataRows: 20, dataCols: 4,
      customBorders: bordersForRows(20),
      customBordersProgressive: true,
    });

    // `true` enables the progressive path with the default chunk size - the config form the
    // guide leads with.
    expect(modelSizeAtInit).toBe(0);

    await expect.poll(() => lab.bordersUpdateCount()).toBe(1);
    // Same as above: prove "once", not "reached once".
    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(1);
    expect((await lab.borderCoords()).length).toBe(20);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
  });

  test('cancels an in-flight progressive load when the configuration is replaced', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    // The load must still be in flight when the configuration is replaced, so both steps run
    // in one synchronous evaluate - no batch can land in between.
    await page.evaluate(() => {
      const config = Array.from({ length: 20 }, (_, row) => (
        { row, col: 0, top: { color: 'green', width: 1 } }
      ));

      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: config,
        customBordersProgressive: { chunkSize: 2 },
      });
      (window as any).hot.updateSettings({
        customBorders: [{ row: 5, col: 1, top: { color: 'red', width: 2 } }],
        customBordersProgressive: false,
      });
    });

    // The pending batches were cancelled: only the new (synchronous) configuration remains.
    await expect.poll(() => lab.borderCoords()).toEqual([{ row: 5, col: 1 }]);
    expect((await lab.cellBorders(5, 1))?.top).toEqual(RED_BORDER);
    // No stray borders left over from the cancelled progressive configuration.
    expect(await lab.cellBorders(0, 0)).toBeNull();
    expect(await lab.cellBorders(19, 0)).toBeNull();

    // And no stale batch fires later to corrupt the replaced configuration.
    await macrotaskBarrier(page);
    expect(await lab.borderCoords()).toEqual([{ row: 5, col: 1 }]);
  });

  test('flushes an in-flight progressive load synchronously when a structural change arrives', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    // The alter must land while batches are still pending, so setup and alter run in one
    // synchronous evaluate; the model state is captured in the same breath.
    const result = await page.evaluate(() => {
      const config = Array.from({ length: 20 }, (_, row) => (
        { row, col: 0, top: { color: 'green', width: 1 } }
      ));

      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: config,
        customBordersProgressive: { chunkSize: 5 },
      });

      const hot = (window as any).hot;
      const plugin = hot.getPlugin('customBorders');
      const modelSizeBeforeAlter = plugin.getBorders().length;

      hot.alter('insert_row_above', 1, 1);

      return {
        modelSizeBeforeAlter,
        rowsAfterAlter: plugin.getBorders().map((border: any) => border.row)
          .sort((a: number, b: number) => a - b),
        updateCountAfterAlter: (window as any).bordersUpdateCount,
      };
    });

    // The load really was in flight when the structural change arrived.
    expect(result.modelSizeBeforeAlter).toBe(0);
    // The queue was drained synchronously before the coordinates remapped: the final model is
    // exactly what the synchronous path would produce - all 20 borders, shifted by the insert.
    expect(result.rowsAfterAlter).toEqual([0, ...Array.from({ length: 19 }, (_, i) => i + 2)]);
    // Draining the queue completes the load, so the completion hook fired exactly once.
    expect(result.updateCountAfterAlter).toBe(1);

    // The flush invalidated the pending batch timers - nothing fires afterwards.
    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(1);
    expect((await lab.borderCoords()).length).toBe(20);

    // The model alone cannot prove the flush happened at the right moment: the core shifts the cell
    // meta before it fires `afterCreateRow`, so a queue drained from there writes its meta at
    // pre-shift coordinates and only the model gets remapped. Pin both.
    expect((await lab.cellBorders(0, 0))?.top).toEqual(GREEN_BORDER);
    // Row 1 is the inserted row - it was never a target.
    expect(await lab.cellBorders(1, 0)).toBeNull();
    // Configured row 1 now lives on row 2, and configured row 19 on row 20.
    expect((await lab.cellBorders(2, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(20, 0))?.top).toEqual(GREEN_BORDER);
  });

  test('applies a customBordersProgressive-only settings change', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 20, dataCols: 4,
      customBorders: bordersForRows(20),
    });

    // Switching only the progressive flag has to reach the plugin. `SETTING_KEYS` decides that:
    // with the inherited default (the plugin key alone) this update is ignored and the option
    // stays inert until an unrelated `customBorders` update happens to come along.
    const modelSizeAfterUpdate = await page.evaluate(() => {
      (window as any).hot.updateSettings({ customBordersProgressive: { chunkSize: 5 } });

      return (window as any).hot.getPlugin('customBorders').getBorders().length;
    });

    // Re-applied progressively, so the model is empty right after the update and fills in later.
    expect(modelSizeAfterUpdate).toBe(0);
    await expect.poll(() => lab.borderCoords().then(coords => coords.length)).toBe(20);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
  });

  test('keeps meta and model in step when a removal arrives mid-load', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await page.evaluate(() => {
      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: Array.from({ length: 20 }, (_, row) => (
          { row, col: 0, top: { color: 'green', width: 1 } }
        )),
        customBordersProgressive: { chunkSize: 5 },
      });
      (window as any).hot.alter('remove_row', 1, 1);
    });

    await expect(lab.cellInMaster(0, 0)).toBeVisible();

    // Configured row 0 stays put; row 1 is gone with its row; rows 2..19 shift up by one.
    expect((await lab.borderCoords()).length).toBe(19);
    expect((await lab.cellBorders(0, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(1, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(18, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.cellBorders(19, 0)).toBeNull();
  });

  test('cancels an in-flight progressive load without firing the hook when the plugin is disabled', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    const result = await page.evaluate(() => {
      const config = Array.from({ length: 20 }, (_, row) => (
        { row, col: 0, top: { color: 'green', width: 1 } }
      ));

      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: config,
        customBordersProgressive: { chunkSize: 2 },
      });

      const hot = (window as any).hot;
      const plugin = hot.getPlugin('customBorders');

      plugin.disablePlugin();
      hot.render();

      return {
        modelSizeAfterDisable: plugin.getBorders().length,
        updateCountAfterDisable: (window as any).bordersUpdateCount,
      };
    });

    expect(result.modelSizeAfterDisable).toBe(0);
    // Cancel-without-hook: the discarded load never signals completion.
    expect(result.updateCountAfterDisable).toBe(0);

    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(0);
    expect(await lab.countVisibleCustomBorders()).toBe(0);
  });

  test('cancels an in-flight progressive load without firing the hook when the instance is destroyed', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await page.evaluate(() => {
      const config = Array.from({ length: 20 }, (_, row) => (
        { row, col: 0, top: { color: 'green', width: 1 } }
      ));

      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: config,
        customBordersProgressive: { chunkSize: 2 },
      });
      (window as any).hot.destroy();
    });

    // The pending batch timers are cleared on destroy - nothing fires and no error surfaces.
    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(0);
  });

  test('flushes an in-flight progressive load even when the structural change is vetoed', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    const result = await page.evaluate(() => {
      const config = Array.from({ length: 20 }, (_, row) => (
        { row, col: 0, top: { color: 'green', width: 1 } }
      ));

      (window as any).createHot({
        dataRows: 20, dataCols: 4,
        customBorders: config,
        customBordersProgressive: { chunkSize: 5 },
      });

      const hot = (window as any).hot;
      const plugin = hot.getPlugin('customBorders');
      const modelSizeBeforeAlter = plugin.getBorders().length;

      hot.addHook('beforeRemoveRow', () => false);
      hot.alter('remove_row', 1, 1);

      return {
        modelSizeBeforeAlter,
        rowCountAfterAlter: hot.countRows(),
        modelSizeAfterAlter: plugin.getBorders().length,
        updateCountAfterAlter: (window as any).bordersUpdateCount,
      };
    });

    // The load was in flight, and the vetoed attempt still drained it synchronously: the flush
    // runs from the `before*` hook, before the veto outcome is knowable. Deliberate trade-off -
    // see `#flushBeforeStructuralChange`. The vetoed operation shifts nothing, so the flushed
    // model matches the configuration exactly and the completion hook fired once.
    expect(result.modelSizeBeforeAlter).toBe(0);
    expect(result.rowCountAfterAlter).toBe(20);
    expect(result.modelSizeAfterAlter).toBe(20);
    expect(result.updateCountAfterAlter).toBe(1);

    // No stale batch fires later, and the applied borders sit at their configured coordinates.
    await macrotaskBarrier(page);
    expect(await lab.bordersUpdateCount()).toBe(1);
    expect((await lab.cellBorders(0, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
  });
});

test.describe('CustomBorders initialization render timing', () => {
  test('does not leak dropdown-menu buttons into upper nested-header rows on init', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    // CustomBorders' `init` handler runs before NestedHeaders builds its header tree (plugin
    // priority 90 vs 280). A render forced from that handler paints a single-row thead, and
    // DropdownMenu then treats every header as bottom-most, injecting its buttons into what
    // becomes the upper nested-header row. Regression: those stale buttons survived the proper
    // two-row render.
    await lab.createGrid({
      dataRows: 10,
      dataCols: 6,
      colHeaders: true,
      nestedHeaders: [
        [{ label: 'Group A', colspan: 3 }, { label: 'Group B', colspan: 3 }],
        ['A', 'B', 'C', 'D', 'E', 'F'],
      ],
      dropdownMenu: true,
      customBorders: true,
    });

    // The bottom-most header row owns the dropdown buttons...
    await expect(lab.headerDropdownButtons(2)).toHaveCount(6);
    // ...and the group row must have none.
    await expect(lab.headerDropdownButtons(1)).toHaveCount(0);
  });
});

test.describe('CustomBorders viewport sync timing', () => {
  test('redraws a frozen-column border that scrolls back into the rendered range', async ({ page, theme, bundle }) => {
    const lab = new CustomBordersLabPage(page, theme, bundle);

    await lab.goto();

    // With frozen columns the grid's own (0, 0) lives in the inline-start clone, so the lab's
    // master-cell readiness check does not apply here.
    await page.evaluate(border => (window as any).createHot({
      dataRows: 100,
      dataCols: 20,
      fixedColumnsStart: 2,
      customBorders: [{ row: 10, col: 0, start: border }],
    }), RED_BORDER);
    await expect(page.locator('.ht_clone_inline_start').getByTestId('cell-0-0')).toBeVisible();

    const frozenColumn = page.locator('.ht_clone_inline_start');

    // Scroll the bordered row out of the rendered band - the selection is culled...
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ row: 90 }));
    await expect(frozenColumn.getByTestId('cell-10-0')).toHaveCount(0);
    expect(await frozenColumn.locator('.wtBorder:visible').count()).toBe(0);

    // ...and back in, which recreates it. The recreated selection has to be picked up by the
    // overlay clones in the same draw: the clones draw their selections before the master draws
    // its own, so a sync running between those two would paint the border in the master only and
    // leave the frozen column blank until an unrelated render happened to come along. Once the
    // clone has re-rendered the bordered cell, that draw is over - the border must already be
    // there, with no further render to wait for.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ row: 10 }));
    await expect(frozenColumn.getByTestId('cell-10-0')).toBeVisible();

    expect(await frozenColumn.locator('.wtBorder:visible').count()).toBeGreaterThan(0);
  });

  test('draws an externally written border without waiting for a further render', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      customBorders: [{ row: 0, col: 0, start: RED_BORDER }],
    });

    expect(await lab.countVisibleCustomBorders()).toBe(1);

    // No explicit `hot.render()` here, unlike the other external-write tests: `setCellMeta` does
    // not render on its own, and syncing the model drops the cell's current border DOM so the
    // viewport sync can rebuild it. The cell must not be left blank in between.
    await page.evaluate(() => (window as any).hot
      .setCellMeta(0, 0, 'borders', { top: { width: 2, color: 'blue' } }));

    expect(await lab.countVisibleCustomBorders()).toBe(1);
    expect((await lab.cellBorders(0, 0))?.top).toEqual({ width: 2, color: 'blue' });
  });

  test('renders a batch of external border meta writes once', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({ dataRows: 10, dataCols: 10, customBorders: true });

    // External `borders` meta arrives one cell at a time - UndoRedo restores the meta of an undone
    // row/column removal cell by cell - so rendering from the write listener itself would run a
    // full render per bordered cell. The batch must resolve to a single render, and it must still
    // land before the browser can paint (a microtask, not a timeout): awaiting one microtask tick
    // is enough for the borders to be on screen.
    const renderCount = await page.evaluate(async () => {
      const hot = (window as any).hot;
      let count = 0;

      hot.addHook('afterViewRender', () => {
        count += 1;
      });

      for (let column = 0; column < 10; column++) {
        hot.setCellMeta(0, column, 'borders', { top: { width: 2, color: 'red' } });
      }

      await Promise.resolve();

      return count;
    });

    expect(renderCount).toBe(1);
    expect(await lab.countVisibleCustomBorders()).toBe(10);
  });
});

test.describe('CustomBorders and vetoed cell-meta writes', () => {
  test('keeps the border out of the model when the meta write is blocked', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({ dataRows: 10, dataCols: 10 });

    // An app can block meta writes on locked cells. The plugin must not record a border whose cell
    // meta was never written - `getBorders()` and `getCellMeta().borders` would then disagree.
    await page.evaluate(() => (window as any).hot.addHook('beforeSetCellMeta', () => false));

    await page.evaluate(() => (window as any).hot.getPlugin('customBorders')
      .setBorders([[2, 2, 2, 2]], { top: { width: 2, color: 'red' } }));

    expect(await lab.cellBorders(2, 2)).toBeNull();
    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.countVisibleCustomBorders()).toBe(0);
  });

  test('keeps the border in the model when the meta removal is blocked', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      customBorders: [{ row: 2, col: 2, top: RED_BORDER }],
    });

    await page.evaluate(() => (window as any).hot.addHook('beforeRemoveCellMeta', () => false));

    await page.evaluate(() => (window as any).hot.getPlugin('customBorders').clearBorders());

    // The removal was vetoed, so the cell keeps its meta - and therefore its model entry.
    expect((await lab.cellBorders(2, 2))?.top).toEqual(RED_BORDER);
    expect(await lab.borderCoords()).toEqual([{ row: 2, col: 2 }]);
  });

  test('keeps the border out of the model when the veto listener removes itself after firing', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({ dataRows: 10, dataCols: 10 });

    // `addHookOnce` deletes the listener the moment it fires, so a guard probed after the write
    // would see no hook and report success for a write that was in fact vetoed.
    await page.evaluate(() => (window as any).hot.addHookOnce('beforeSetCellMeta', () => false));

    await page.evaluate(() => (window as any).hot.getPlugin('customBorders')
      .setBorders([[2, 2, 2, 2]], { top: { width: 2, color: 'red' } }));

    expect(await lab.cellBorders(2, 2)).toBeNull();
    expect(await lab.borderCoords()).toEqual([]);
  });

  test('removes borders past a benign beforeRemoveCellMeta listener when a `borders` key cascades from the grid settings', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      borders: { top: { width: 1, color: 'blue' } },
      customBorders: [{ row: 2, col: 2, top: RED_BORDER }],
    });

    // A listener that observes but does not veto keeps the verification read on (no fast path),
    // so this pins the own-property check itself: after the removal the resolved meta still holds
    // the cascaded value, and only own-property presence can tell a veto from a cascade.
    await page.evaluate(() => (window as any).hot.addHook('beforeRemoveCellMeta', () => {}));

    await page.evaluate(() => (window as any).hot.getPlugin('customBorders').clearBorders());

    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.countVisibleCustomBorders()).toBe(0);
  });

  test('removes borders even when a `borders` key cascades from the grid settings', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    // A grid-level `borders` key is not an official setting, but the meta layers copy every key
    // (`extend` filters nothing against the schema), so it lands on the cell meta's prototype
    // chain. `removeCellMeta` deletes the own key only - a resolved read then still sees the
    // inherited value, which used to make every removal look vetoed and kept the border in the
    // model (and on screen) forever.
    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      borders: { top: { width: 1, color: 'blue' } },
      customBorders: [{ row: 2, col: 2, top: RED_BORDER }],
    });

    await page.evaluate(() => (window as any).hot.getPlugin('customBorders').clearBorders());

    expect(await lab.borderCoords()).toEqual([]);
    expect(await lab.countVisibleCustomBorders()).toBe(0);
  });

  test('replaces the configuration on updateSettings even when a `borders` key cascades from a column', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    // Same prototype-chain trap through the column layer: `#resetBorderModel` runs on every
    // `createCustomBorders`, so a false veto used to carry the previous configuration forward
    // through every `updateSettings({ customBorders })` replace.
    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      columns: Array.from({ length: 10 }, () => ({ borders: { top: { width: 1, color: 'blue' } } })),
      customBorders: [{ row: 2, col: 2, top: RED_BORDER }],
    });

    await page.evaluate(() => (window as any).hot.updateSettings({
      customBorders: [{ row: 5, col: 5, top: { color: 'green', width: 1 } }],
    }));

    expect(await lab.borderCoords()).toEqual([{ row: 5, col: 5 }]);
    expect((await lab.cellBorders(5, 5))?.top).toEqual(GREEN_BORDER);
    // The plugin's own RED_BORDER key is gone; what remains resolved at (2, 2) is the cascaded
    // column-level value, which is not plugin-owned and stays visible to `getCellMeta` by design.
    expect((await lab.cellBorders(2, 2))?.top).toEqual({ width: 1, color: 'blue' });
  });
});

test.describe('CustomBorders row index maintenance', () => {
  test('keeps the rendered set correct across repeated add, restyle and remove', async ({ page, theme, bundle }) => {
    const lab = await gotoLab(page, theme, bundle);

    await lab.createGrid({
      dataRows: 10, dataCols: 10,
      customBorders: [{ row: 1, col: 1, top: RED_BORDER }],
    });

    const plugin = (fn: string, args: unknown[]) => page.evaluate(
      ([name, a]) => (window as any).hot.getPlugin('customBorders')[name as string](...(a as unknown[])),
      [fn, args] as const);

    // The row index is patched per border rather than rebuilt from the whole model, so an add, a
    // restyle of the same cell and a removal all have to leave it consistent.
    await plugin('setBorders', [[[3, 3, 3, 3]], { top: GREEN_BORDER }]);
    expect(await lab.countVisibleCustomBorders()).toBe(2);

    await plugin('setBorders', [[[3, 3, 3, 3]], { top: RED_BORDER }]);
    expect(await lab.countVisibleCustomBorders()).toBe(2);
    expect((await lab.cellBorders(3, 3))?.top).toEqual(RED_BORDER);

    await plugin('setBorders', [[[3, 3, 3, 3]]]);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
    expect(await lab.borderCoords()).toEqual([{ row: 1, col: 1 }]);
  });
});
