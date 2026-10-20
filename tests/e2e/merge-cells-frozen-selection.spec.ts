import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

// The fill handle's center sits on the block's corner; allow for the handle's own offset and the
// theme's border widths.
const CORNER_TOLERANCE = 4;

/**
 * An outline drawn on every track of every side of a `rows` x `columns` block.
 *
 * @param {number} rows The block's row span.
 * @param {number} columns The block's column span.
 * @returns {object}
 */
function fullOutline(rows: number, columns: number) {
  return {
    top: Array(columns).fill(true),
    bottom: Array(columns).fill(true),
    left: Array(rows).fill(true),
    right: Array(rows).fill(true),
  };
}

/**
 * Asserts one outline around the block and exactly one reachable fill handle, owned by the given
 * overlay and centered on the block's bottom-end corner.
 *
 * @param {SelectionFeaturesPage} grid The page object of the grid under test.
 * @param {number} row The block's root row.
 * @param {number} col The block's root column.
 * @param {object} span The block's `rowspan` and `colspan`.
 * @param {string} owner The overlay expected to own the fill handle.
 */
async function expectOneOutlineAndHandle(
  grid: SelectionFeaturesPage,
  row: number,
  col: number,
  span: { rowspan: number, colspan: number },
  owner = 'ht_master',
): Promise<void> {
  await expect.poll(async () => (await grid.mergedBlockSelection(row, col)).fillHandles.length).toBe(1);

  const { edgesInside, outline, fillHandles } = await grid.mergedBlockSelection(row, col);

  expect(edgesInside).toEqual([]);
  expect(outline).toEqual(fullOutline(span.rowspan, span.colspan));
  expect(fillHandles[0].overlay).toBe(owner);
  expect(Math.abs(fillHandles[0].dx)).toBeLessThanOrEqual(CORNER_TOLERANCE);
  expect(Math.abs(fillHandles[0].dy)).toBeLessThanOrEqual(CORNER_TOLERANCE);
}

/**
 * A merged cell that crosses a freeze line is rendered once per overlay, and each overlay shows only
 * the part of the block its own band covers. Selecting it used to draw a closed selection box around
 * every part, so the freeze lines showed as selection edges through the merged cell, and every
 * overlay drew its own fill handle (DEV-143). The selection must look like the one of an unmerged
 * block: one outline and one fill handle, on the block's bottom-end corner.
 */
test.describe('selection of a merged cell across the frozen panes', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  const BLOCK_ACROSS_BOTH_LINES = { row: 0, col: 0, rowspan: 3, colspan: 3 };

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
  });

  test('draws one outline and one fill handle for a block crossing both freeze lines', async () => {
    await grid.initGrid({ fixedRowsTop: 2, fixedColumnsStart: 2, mergeCells: [BLOCK_ACROSS_BOTH_LINES] });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(grid, 0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('draws one outline and one fill handle with virtualized merged cells', async () => {
    // With `virtualized`, MergeCells clamps the block's spans to each overlay's band itself, and the
    // `modifyGetCellCoords` extent the fix reads is clamped to the master's band.
    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: { virtualized: true, cells: [BLOCK_ACROSS_BOTH_LINES] },
    });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(grid, 0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('keeps the fill handle of a block that fits inside the frozen corner', async () => {
    // Nothing crosses a freeze line here: the corner overlay renders the whole block, so it keeps
    // its handle. The copies the master and the other clones draw sit under the corner.
    const block = { row: 0, col: 0, rowspan: 2, colspan: 2 };

    await grid.initGrid({ fixedRowsTop: 3, fixedColumnsStart: 3, mergeCells: [block] });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(grid, 0, 0, block, 'ht_clone_top_inline_start_corner');
  });

  test('draws one fill handle when an area selection ends inside a block crossing both freeze lines', async () => {
    // The selection grows to cover the whole block, so its bottom-end corner is the block's. The
    // clones that clamp the area to their band land on the block's root cell, and the
    // `modifyGetCellCoords` remap then points each of them at that same corner.
    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 3 }],
    });
    await grid.selectCells(0, 0, 2, 2);

    await expect.poll(async () => (await grid.mergedBlockSelection(1, 1)).fillHandles).toEqual([
      expect.objectContaining({ overlay: 'ht_master' }),
    ]);
  });

  test('draws one outline and one fill handle in a right-to-left grid', async () => {
    await grid.initGrid({
      layoutDirection: 'rtl',
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [BLOCK_ACROSS_BOTH_LINES],
    });
    await grid.selectCells(0, 0, 0, 0);

    await expectOneOutlineAndHandle(grid, 0, 0, BLOCK_ACROSS_BOTH_LINES);
  });

  test('draws no edge on the freeze line when a virtualized block is scrolled under the frozen rows', async () => {
    // The master renders only the block's lower part, and the `top` overlay its top rows. The
    // extent the fix reads is clamped to the master's band here, so this is the case where the
    // two merged-cell modes differ.
    await grid.initGrid({
      data: Array.from({ length: 80 }, (_, row) => Array.from({ length: 10 }, (__, col) => `R${row + 1}C${col + 1}`)),
      fixedRowsTop: 2,
      mergeCells: { virtualized: true, cells: [{ row: 1, col: 1, rowspan: 30, colspan: 2 }] },
    });
    await grid.selectCells(1, 1, 1, 1);
    await grid.scrollToRow(12);

    // Proves the redraw landed and the block's outline is actually on screen, so the two checks
    // below cannot pass merely because nothing was drawn at all.
    await expect.poll(() => grid.isSelectionEdgeAtColumnStart(12, 1)).toBe(true);

    expect(await grid.isSelectionEdgeOnFrozenRowsLine(1)).toBe(false);
    expect(await grid.isSelectionEdgeOnFrozenRowsLine(2)).toBe(false);
  });

  test('draws one outline for a custom border on a block crossing both freeze lines', async () => {
    // Custom borders draw through the same single-coordinate path as a merged focus cell.
    const side = { width: 2, color: 'red' };

    await grid.initGrid({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      mergeCells: [BLOCK_ACROSS_BOTH_LINES],
      customBorders: [{ row: 0, col: 0, top: side, bottom: side, start: side, end: side }],
    });

    await expect.poll(async () => (await grid.mergedBlockSelection(0, 0)).outline)
      .toEqual(fullOutline(3, 3));
    expect((await grid.mergedBlockSelection(0, 0)).edgesInside).toEqual([]);
  });

  test('keeps a plain cell\'s fill handle when an unrelated hook answers with a short result', async () => {
    // budnix review on #13667: `modifyGetCellCoords` may legally return `[row, column]` (no area),
    // and a hook indifferent to `source` answers even this fix's own `'render'`-sourced lookup with
    // that shape. Reading its 3rd/4th slots as a merge extent then made every plain cell's own
    // fill handle disappear, since nothing crossing a freeze line is even involved here.
    await grid.initGrid({});
    await grid.addNaiveModifyGetCellCoordsHook();
    await grid.selectCells(2, 2, 2, 2);

    await expect.poll(async () => (await grid.mergedBlockSelection(2, 2)).fillHandles).toEqual([
      expect.objectContaining({ overlay: 'ht_master' }),
    ]);
  });
});

/**
 * A block anchored in the scrolling columns that reaches into `fixedColumnsEnd` is drawn in the
 * inline-end clone from the clone's first column on. The clone resolves the block to its first
 * rendered column, so it fills and outlines its part like the master does.
 */
test.describe('selection of a merged cell that reaches into the end frozen columns', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  const wideData = () => Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => `R${r + 1}C${c + 1}`));
  const BLOCKS = [
    { name: 'a block of one row', block: { row: 1, col: 8, rowspan: 1, colspan: 3 }, extra: {},
      owner: 'ht_clone_inline_end' },
    { name: 'a taller block', block: { row: 1, col: 8, rowspan: 2, colspan: 3 }, extra: {},
      owner: 'ht_clone_inline_end' },
    { name: 'a block in the top end corner', block: { row: 0, col: 8, rowspan: 1, colspan: 3 },
      extra: { fixedRowsTop: 2 }, owner: 'ht_clone_top_inline_end_corner' },
    { name: 'a block in the bottom end corner', block: { row: 4, col: 8, rowspan: 1, colspan: 3 },
      extra: { fixedRowsBottom: 2 }, owner: 'ht_clone_bottom_inline_end_corner' },
    { name: 'a block that starts on the first end column', block: { row: 1, col: 9, rowspan: 1, colspan: 2 },
      extra: {}, owner: 'ht_clone_inline_end' },
  ];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
  });

  for (const direction of ['ltr', 'rtl']) {
    for (const virtualized of [false, true]) {
      test.describe(`${direction}, virtualized ${virtualized}`, () => {
        const init = (block: object, extra: object = {}) => grid.initGrid({
          data: wideData(),
          width: 360,
          layoutDirection: direction,
          fixedColumnsEnd: 3,
          mergeCells: { virtualized, cells: [block] },
          ...extra,
        });

        // Every shape runs once (ltr, virtualized off). In rtl the direction only moves the border positioning,
        // which the corner overlays and the boundary shape still exercise. With virtualized merged cells every
        // inline-end clone clamps the anchor to its first column, and `Border#resolveMergedBlockEdges` looks the
        // block up again for each of them, so the one-row block stands for the other shapes there.
        const shapes = BLOCKS.filter(({ name }) => (direction === 'ltr' && !virtualized)
          || name === 'a block of one row'
          || (direction === 'rtl' && !virtualized && name !== 'a taller block'));

        for (const { name, block, extra, owner } of shapes) {
          test(`draws one outline and one fill handle around ${name}`, async () => {
            await init(block, extra);
            await grid.scrollToColumn(8);
            await grid.selectCells(block.row, block.col, block.row, block.col);

            await expectOneOutlineAndHandle(grid, block.row, block.col, block, owner);
          });
        }

        // The area scan reads logical indexes: no direction term, and no clamp at scroll 0.
        if (direction === 'ltr' && !virtualized) {
          test('fills the part of the block in the end clone', async ({ page }) => {
            await init(BLOCKS[0].block);
            await grid.scrollToColumn(8);
            await grid.selectCells(1, 8, 2, 10);

            await expect.poll(() => page.evaluate(() => {
              const cell = document.querySelector('.ht_clone_inline_end tbody tr:nth-child(2) td');

              return !!cell && (cell.classList.contains('area') || cell.classList.contains('current'));
            })).toBe(true);
            // The row above the block is outside the selection.
            expect(await page.evaluate(() => document.querySelector('.ht_clone_inline_end tbody tr:nth-child(1) td')
              ?.classList.contains('area'))).toBe(false);
          });
        }

        // `Table#getCell` and the hook use logical indexes, so the direction does not reach these two.
        if (direction === 'ltr') {
          test('selects the block while its anchor is scrolled out of view', async ({ page }) => {
            await init(BLOCKS[0].block);
            await grid.scrollToColumn(0);
            await grid.selectCells(1, 8, 1, 8, false);

            await expect(page.locator('.ht_master [data-testid="cell-1-8"]')).toHaveCount(0);

            // The part of the block in the end clone has its top, bottom and end edges and the fill handle, and
            // no start edge: the block goes on past the freeze line. The master's header of column 8 is not
            // rendered here, so the whole-block probe of the page object cannot measure this shape.
            await expect.poll(() => page.evaluate(() => {
              const shown = (selector: string) => Array.from(document.querySelectorAll(
                `.ht_clone_inline_end .wtBorder.current${selector}`
              )).filter(edge => getComputedStyle(edge).display !== 'none').length;

              return { edges: shown(':not(.corner)'), handles: shown('.corner') };
            })).toEqual({ edges: 3, handles: 1 });
          });

          test('answers the end clone\'s cell for a topmost lookup of a covered end column', async ({ page }) => {
            await init(BLOCKS[0].block);
            await grid.scrollToColumn(0);

            expect(await page.evaluate(() => !!window.hot.getCell(1, 9, true)?.closest('.ht_clone_inline_end')))
              .toBe(true);
            expect(await page.evaluate(() => window.hot.getCell(1, 9, true)?.textContent)).toBe('R2C9');
          });
        }

      });
    }
  }
});
