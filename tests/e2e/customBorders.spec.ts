import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { CustomBordersLabPage } from '../fixtures/pages/CustomBordersLabPage';

const GREEN_BORDER = { color: 'green', width: 1 };
const RED_BORDER = { color: 'red', width: 2 };
// The range-level colors #548235 / #C6E0B4 as the DOM reports them.
const DARK_GREEN_RGB = 'rgb(84, 130, 53)';
const LIGHT_GREEN_RGB = 'rgb(198, 224, 180)';

/**
 * Open the lab fixture, which lets each test create the exact grid it needs.
 */
async function gotoLab(page: Page, theme: string): Promise<CustomBordersLabPage> {
  const lab = new CustomBordersLabPage(page, theme);

  await lab.goto();

  return lab;
}

/**
 * Functional coverage for the CustomBorders viewport working set. The border
 * DOM (`.wtBorder` divs) is created per overlay by the selection manager, so
 * the assertions target the overlay containers directly. Visible border
 * edges carry inline sizes; hidden ones are `display: none`, which the
 * `:visible` filter excludes.
 */
test.describe('CustomBorders with frozen rows and columns', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();
  });

  test('renders borders located in the frozen areas', async ({ page }) => {
    // (0,0) lives in every frozen overlay; (10,0) in inline-start; (0,10) in top.
    await expect(page.locator('.ht_clone_top_inline_start_corner .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // (10,10) is in the master viewport.
    await expect(page.locator('.ht_master .wtBorder:visible').first()).toBeVisible();
  });

  test('keeps the frozen column border rendered after scrolling far right', async ({ page }) => {
    // Scrolling only the column axis leaves the master row window unchanged, so (10, 0)'s row
    // stays rendered - isolating whether the frozen-start column keeps its border once the
    // master column range moves past col 0. Scrolled far enough (col 90 of 100) that col 10 is
    // out of the master range on every theme.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ col: 90 }));
    // The frozen column keeps its border even though the master range excludes col 0.
    await expect(page.locator('.ht_clone_inline_start .wtBorder:visible').first()).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its column scrolled out - its selection must be
    // culled (virtualization intact). Asserted by id rather than by `customSelections.length`:
    // the surviving count depends on how many rows/columns a given theme's cell size renders,
    // so a specific id is the theme-robust signal. `expect.poll` (rather than one `evaluate` read)
    // tolerates the render/cleanup happening a tick after `scrollViewportTo` resolves.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col10'))).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col0'))).toBe(true);
  });

  test('keeps the frozen row border rendered after scrolling far down', async ({ page }) => {
    // Scrolling only the row axis leaves the master column window unchanged, so (0, 10)'s column
    // stays rendered - isolating whether the frozen-top row keeps its border once the master row
    // range moves past row 0. Scrolled far enough (row 45 of 50) that row 10 is out of the master
    // range on every theme.
    await page.evaluate(() => (window as any).hot.scrollViewportTo({ row: 45 }));
    // The frozen row keeps its border even though the master range excludes row 0.
    await expect(page.locator('.ht_clone_top .wtBorder:visible').first()).toBeVisible();
    // (10, 10) is fully unfrozen on both axes and its row scrolled out - its selection must be
    // culled (virtualization intact). See the sibling test above for why this is asserted by id,
    // via `expect.poll`, instead of `customSelections.length`.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row10col10'))).toBe(false);
    // The frozen-area border under test is still part of the working set.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.selection.highlight.customSelections
        .some((s: any) => s.settings?.id === 'border_row0col10'))).toBe(true);
  });
});

test.describe('CustomBorders and UndoRedo', () => {
  test.beforeEach(async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();
  });

  test('restores a border removed together with its row when the removal is undone', async ({ page }) => {
    const afterRemove = await page.evaluate(() => {
      const hot = (window as any).hot;

      hot.alter('remove_row', 10);

      return hot.getPlugin('customBorders').getBorders().some((b: any) => b.row === 10 && b.col === 0);
    });

    expect(afterRemove).toBe(false);

    await page.evaluate(() => (window as any).hot.getPlugin('undoRedo').undo());

    // The border meta is restored asynchronously after the undone row comes back; poll on the
    // plugin model instead of a fixed-time wait.
    await expect.poll(() => page.evaluate(() =>
      (window as any).hot.getPlugin('customBorders').getBorders()
        .some((b: any) => b.row === 10 && b.col === 0))).toBe(true);
    expect(await page.evaluate(() => Boolean((window as any).hot.getCellMeta(10, 0).borders))).toBe(true);
  });
});

test.describe('CustomBorders selection ownership', () => {
  test('clearBorders() keeps custom selections the plugin does not own', async ({ page, theme }) => {
    await page.goto(`/tests/fixtures/demo/custom-borders.html?theme=${theme}`);
    await expect(page.getByTestId('cell-0-2')).toBeVisible();

    const result = await page.evaluate(() => {
      const hot = (window as any).hot;
      const coords = hot._createCellCoords(5, 5);

      hot.selection.highlight.addCustomSelection({
        border: { width: 2, color: 'orange' },
        visualCellRange: hot._createCellRange(coords, coords, coords),
      });

      const beforeClear = hot.selection.highlight.customSelections.length;

      hot.getPlugin('customBorders').clearBorders();

      return { beforeClear, afterClear: hot.selection.highlight.customSelections.length };
    });

    // The plugin owned at least one selection alongside the foreign one, so the clear had
    // plugin-owned DOM to remove - without this the test would pass vacuously.
    expect(result.beforeClear).toBeGreaterThanOrEqual(2);
    // Only the foreign selection must survive the plugin's clear.
    expect(result.afterClear).toBe(1);
  });
});

test.describe('CustomBorders structural changes (issues #11031, #6063, #3296)', () => {
  test('moves a border down when a row is inserted above it', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('moves a border down by the inserted amount for a multi-row insert', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border in place when a row is inserted below it at its own index', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('moves a border up when a row above it is removed', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

    await lab.createGrid({
      dataRows: 5, dataCols: 3,
      customBorders: [{ row: 3, col: 0, top: GREEN_BORDER }],
    });

    await lab.alter('remove_row', 1, 1);

    expect(await lab.borderCoords()).toEqual([{ row: 2, col: 0 }]);
    expect((await lab.cellBorders(2, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('drops a border when its own row is removed', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('moves a border right when a column is inserted before it', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('moves a border right by the inserted amount for a multi-column insert', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

    await lab.createGrid({
      dataRows: 3, dataCols: 5,
      customBorders: [{ row: 0, col: 3, start: RED_BORDER }],
    });

    await lab.alter('insert_col_start', 1, 2);

    expect(await lab.borderCoords()).toEqual([{ row: 0, col: 5 }]);
    expect((await lab.cellBorders(0, 5))?.start).toEqual(RED_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBe(1);
  });

  test('keeps a border in place when a column is inserted after it at its own index', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('drops a border when its own column is removed', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('lets the context menu remove a border after it was shifted by a row insert (orphaned id)', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border on its cell when the row is moved with manualRowMove', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps borders on their data cells when multiple rows are moved in one batch', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border on its cell when the column is moved with manualColumnMove', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('moves a border back on undo of a row insert and forward again on redo', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps the range border edges aligned across corner and middle cells after an insert', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border on its data cell when a row is inserted with trimmed rows active', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border on its data cell when a row is removed with trimmed rows active', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps a border on its data cell when a row is inserted with hidden rows active', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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
  test('applies the range-level `border` style to empty sides instead of the default', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('keeps the borders from both ranges where two ranges overlap', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('aligns edges and stacks deterministically where ranges of different widths overlap', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('does not leave a border edge sticking out into a column inserted inside a range', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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
  test('aligns edges and stacks deterministically where ranges of different widths overlap', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('does not leave a border edge sticking out into a column inserted inside a range', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

test.describe('CustomBorders border DOM working set', () => {
  test('does not materialize custom border DOM in header-only overlays', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('materializes a border again when its hidden row is shown', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('fires afterCustomBordersUpdate synchronously when progressive is disabled (default)', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('defers border application and applies it in the background when enabled', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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
    expect((await lab.borderCoords()).length).toBe(20);
    expect((await lab.cellBorders(0, 0))?.top).toEqual(GREEN_BORDER);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
    expect(await lab.countVisibleCustomBorders()).toBeGreaterThan(0);
  });

  test('defers border application with the plain boolean `true` form', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

    const modelSizeAtInit = await lab.createGrid({
      dataRows: 20, dataCols: 4,
      customBorders: bordersForRows(20),
      customBordersProgressive: true,
    });

    // `true` enables the progressive path with the default chunk size - the config form the
    // guide leads with.
    expect(modelSizeAtInit).toBe(0);

    await expect.poll(() => lab.bordersUpdateCount()).toBe(1);
    expect((await lab.borderCoords()).length).toBe(20);
    expect((await lab.cellBorders(19, 0))?.top).toEqual(GREEN_BORDER);
  });

  test('cancels an in-flight progressive load when the configuration is replaced', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('flushes an in-flight progressive load synchronously when a structural change arrives', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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
  });

  test('cancels an in-flight progressive load without firing the hook when the plugin is disabled', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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

  test('cancels an in-flight progressive load without firing the hook when the instance is destroyed', async ({ page, theme }) => {
    const lab = await gotoLab(page, theme);

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
});
