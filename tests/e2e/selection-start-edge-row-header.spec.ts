import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EditorRowHeaderBorderPage, type GridName } from '../fixtures/pages/EditorRowHeaderBorderPage';

// The column that comes first once the grid is scrolled by eight 50px columns.
const FIRST_VISIBLE_COLUMN = 8;
const ON_THE_CELL_EDGE = { offset: 0, hiddenUnderOverlay: 0 };
const ON_THE_GRIDLINE = { offset: -1, hiddenUnderOverlay: 0 };
// The row that comes first once a grid is scrolled by fifty 23px rows.
const FIRST_VISIBLE_ROW = 50;

/**
 * The selection's start edge is 2px wide and is centered on the gridline it shares with the previous
 * cell. When an inline-start overlay is painted over that gridline, half of the edge is hidden under
 * it, so the edge has to sit on the cell's own start boundary instead. The overlay's layer is above
 * the master selection layer, so the edge is in the DOM either way: every case below measures how
 * much of it lies inside the overlay's table.
 *
 * The cells that have to move are the first one a table draws after the overlay:
 *
 *  - the first fully visible column of a scrolled grid with row headers, where the default overscan
 *    puts a hidden column between the row header and the cell;
 *  - the first column past `fixedColumnsStart` in a scrolled grid;
 *  - the same column in a frozen top or bottom row, whose clone sits under the start corner.
 *
 * Every other cell keeps the edge on the gridline.
 */
test.describe('Selection start edge next to an inline-start overlay', { tag: THEMES_TAG }, () => {
  let grid: EditorRowHeaderBorderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorRowHeaderBorderPage(page, theme, bundle);
    await grid.goto();
  });

  const SCROLLED: GridName[] = ['row-headers', 'frozen'];

  for (const name of SCROLLED) {
    test(`the first visible column of a scrolled grid keeps the whole start edge in view (${name})`, async() => {
      const column = FIRST_VISIBLE_COLUMN;

      await grid.scrollToColumn(name, column);

      await expect.poll(() => grid.startEdge(name, 0, column)).toEqual(ON_THE_CELL_EDGE);
    });

    test(`the column after the first visible one keeps the edge on the gridline (${name})`, async() => {
      const column = FIRST_VISIBLE_COLUMN;

      await grid.scrollToColumn(name, column);

      await expect.poll(() => grid.startEdge(name, 0, column + 1)).toEqual(ON_THE_GRIDLINE);
    });
  }

  test('the edge follows a scroll that brings its column next to the overlay', async() => {
    const column = FIRST_VISIBLE_COLUMN;

    await grid.scrollToColumn('row-headers', column);

    await expect.poll(() => grid.startEdge('row-headers', 0, column + 1)).toEqual(ON_THE_GRIDLINE);

    await grid.scrollToColumn('row-headers', column + 1);
    await expect.poll(() => grid.startEdge('row-headers', 0, column + 1, { select: false }))
      .toEqual(ON_THE_CELL_EDGE);
  });

  test('the first visible column keeps the whole start edge in view in a frozen top row', async() => {
    const column = FIRST_VISIBLE_COLUMN;

    await grid.scrollToColumn('scrolled-top', column);

    await expect.poll(() => grid.startEdge('scrolled-top', 0, column, { layer: 'top' }))
      .toEqual(ON_THE_CELL_EDGE);
    // The same column in the master table, below the frozen row.
    await expect.poll(() => grid.startEdge('scrolled-top', 3, column)).toEqual(ON_THE_CELL_EDGE);
  });

  test('the first visible column keeps the whole start edge in view in a frozen top and bottom row', async() => {
    const column = FIRST_VISIBLE_COLUMN;

    await grid.scrollToColumn('frozen-rows', column);

    await expect.poll(() => grid.startEdge('frozen-rows', 0, column, { layer: 'top' }))
      .toEqual(ON_THE_CELL_EDGE);
    await expect.poll(() => grid.startEdge('frozen-rows', 7, column, { layer: 'bottom' }))
      .toEqual(ON_THE_CELL_EDGE);
  });

  test('the first visible column of a scrolled RTL grid keeps the whole start edge in view', async() => {
    const column = FIRST_VISIBLE_COLUMN;

    await grid.scrollToColumn('rtl', column);

    await expect.poll(() => grid.startEdge('rtl', 0, column)).toEqual(ON_THE_CELL_EDGE);
    await expect.poll(() => grid.startEdge('rtl', 0, column + 1)).toEqual(ON_THE_GRIDLINE);
  });

  test('a grid with no overlay on the start side keeps the edge on the gridline', async() => {
    await grid.scrollToColumn('no-row-headers', FIRST_VISIBLE_COLUMN);

    await expect.poll(() => grid.startEdge('no-row-headers', 0, FIRST_VISIBLE_COLUMN)).toEqual(ON_THE_GRIDLINE);
  });

  test('column A behind the row headers keeps the whole start edge in view', async() => {
    await expect.poll(() => grid.startEdge('row-headers', 0, 0)).toEqual(ON_THE_CELL_EDGE);
  });

  const VERTICAL: GridName[] = ['rows', 'rows-frozen'];

  for (const name of VERTICAL) {
    test(`the first visible row of a scrolled grid keeps the whole top edge in view (${name})`, async() => {
      await grid.scrollToRow(name, FIRST_VISIBLE_ROW);

      await expect.poll(() => grid.topEdge(name, FIRST_VISIBLE_ROW, 1)).toEqual(ON_THE_CELL_EDGE);
    });

    test(`the row after the first visible one keeps the top edge on the gridline (${name})`, async() => {
      await grid.scrollToRow(name, FIRST_VISIBLE_ROW);

      await expect.poll(() => grid.topEdge(name, FIRST_VISIBLE_ROW + 1, 1)).toEqual(ON_THE_GRIDLINE);
    });
  }

  test('the top edge follows a scroll that brings its row next to the overlay', async() => {
    await grid.scrollToRow('rows', FIRST_VISIBLE_ROW);
    await expect.poll(() => grid.topEdge('rows', FIRST_VISIBLE_ROW + 1, 1)).toEqual(ON_THE_GRIDLINE);

    await grid.scrollToRow('rows', FIRST_VISIBLE_ROW + 1);
    await expect.poll(() => grid.topEdge('rows', FIRST_VISIBLE_ROW + 1, 1, { select: false }))
      .toEqual(ON_THE_CELL_EDGE);
  });

  test('the first visible row of a scrolled grid keeps the whole top edge in view in the end column', async() => {
    await grid.scrollToRow('rows-end', FIRST_VISIBLE_ROW);

    await expect.poll(() => grid.topEdge('rows-end', FIRST_VISIBLE_ROW, 9, { layer: 'inline_end' }))
      .toEqual(ON_THE_CELL_EDGE);
    await expect.poll(() => grid.topEdge('rows-end', FIRST_VISIBLE_ROW + 1, 9, { layer: 'inline_end' }))
      .toEqual(ON_THE_GRIDLINE);
  });

  test('the first visible row of a scrolled grid keeps the whole top edge in view in the start column', async() => {
    await grid.scrollToRow('rows-start', FIRST_VISIBLE_ROW);

    // The cell is in the frozen column's clone, under the top start corner.
    await expect.poll(() => grid.topEdge('rows-start', FIRST_VISIBLE_ROW, 0, { layer: 'inline_start' }))
      .toEqual(ON_THE_CELL_EDGE);
    await expect.poll(() => grid.topEdge('rows-start', FIRST_VISIBLE_ROW + 1, 0, { layer: 'inline_start' }))
      .toEqual(ON_THE_GRIDLINE);
  });

  test('the first row of an unscrolled grid keeps the whole top edge in view', async() => {
    await expect.poll(() => grid.topEdge('rows', 0, 1)).toEqual(ON_THE_CELL_EDGE);
  });
});
