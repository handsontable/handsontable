import { test, expect, THEMES_TAG } from '../fixtures/test';
import {
  AutoRowSizeMergedHiddenOriginPage,
  type GridSettings,
} from '../fixtures/pages/AutoRowSizeMergedHiddenOriginPage';

/**
 * With AutoRowSize on, a merge whose first row or first column is hidden is drawn on the first row and
 * column of it that are still shown. That cell is covered by the merge, so the plugin sampled nothing for
 * it, and the row it sits in kept the default height in the row-header clone while the master grew to the
 * merge's text. The header of that row came out shorter than the row beside it.
 *
 * Every case builds the merge `{ row: 1, col: 4, rowspan: 2, colspan: 2 }` (three rows in the cases that
 * trim) over 10 x 10 spreadsheet data, writes text into its first cell, and expects two things. Every row
 * header is as tall as its row. And the row the merge is drawn on is as tall as the same grid makes it with
 * nothing hidden (the control): that is what tells a measurement at the block's width from one at a single
 * column's width, because both panes read the same stored height and stay aligned whatever it is.
 *
 * The text either has hard line breaks or wraps only because the merged width is narrow.
 */
const MERGE = [{ row: 1, col: 4, rowspan: 2, colspan: 2 }];
const TALL_MERGE = [{ row: 1, col: 4, rowspan: 3, colspan: 2 }];
const AT_MERGE = { row: 1, col: 4 };
const LINES = 'line one\nline two\nline three\nline four';
const WORDS = 'word word word word word word word word word word word word word word word word word word';
// A row grown by the merge's text is at least this much taller than a plain row, on every theme. The
// precondition: with no row grown, every comparison of the two panes passes on code that has the bug.
const GROWN_BY_AT_LEAST = 10;

test.describe('row headers beside a merge whose origin is hidden', { tag: THEMES_TAG }, () => {
  let grid: AutoRowSizeMergedHiddenOriginPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoRowSizeMergedHiddenOriginPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Builds the grid with nothing hidden or trimmed and returns the height of every row once it has settled.
   */
  async function controlRowHeights(settings: GridSettings, value: string): Promise<number[]> {
    await grid.build(settings, { ...AT_MERGE, value });
    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    return grid.rowHeights();
  }

  const tallestRow = async() => Math.max(...await grid.rowHeights());

  test('control: a merge with nothing hidden keeps every row header as tall as its row', async() => {
    await controlRowHeights({ mergeCells: MERGE }, LINES);
  });

  test('a hidden first row of the merge, text with line breaks', async() => {
    const control = await controlRowHeights({ mergeCells: MERGE }, LINES);

    await grid.build({ mergeCells: MERGE, hiddenRows: { rows: [1] } }, { ...AT_MERGE, value: LINES });

    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(Math.max(...control));
  });

  test('a hidden first row of the merge, text that wraps only by the merged width', async() => {
    const settings = { mergeCells: MERGE, colWidths: 50 };
    const control = await controlRowHeights(settings, WORDS);

    await grid.build({ ...settings, hiddenRows: { rows: [1] } }, { ...AT_MERGE, value: WORDS });

    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    // Measured at one column's width the text would wrap twice as often, and the row would be taller than the
    // control's.
    await expect.poll(tallestRow).toBe(Math.max(...control));
  });

  test('hiding the first row of a merge that was drawn from it', async() => {
    const control = await controlRowHeights({ mergeCells: MERGE }, LINES);

    await grid.build({ mergeCells: MERGE, hiddenRows: true }, { ...AT_MERGE, value: LINES });
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    await grid.callPlugin('hiddenRows', 'hideRows', [1]);

    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(Math.max(...control));
  });

  test('showing the first row of a merge that was drawn from the row below', async() => {
    const control = await controlRowHeights({ mergeCells: MERGE }, LINES);

    await grid.build({ mergeCells: MERGE, hiddenRows: { rows: [1] } }, { ...AT_MERGE, value: LINES });
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    await grid.callPlugin('hiddenRows', 'showRows', [1]);

    // The row below the first one held the block's height while it was drawn there, and has to go back to
    // the default one: panes that read the same stale height stay aligned, so the rows are compared with the
    // control's.
    await expect.poll(() => grid.rowHeights()).toEqual(control);
  });

  test('a hidden first column of the merge', async() => {
    const control = await controlRowHeights({ mergeCells: MERGE }, LINES);

    await grid.build({ mergeCells: MERGE, hiddenColumns: { columns: [4] } }, { ...AT_MERGE, value: LINES });

    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(Math.max(...control));
  });

  test('showing the first column of a merge that was drawn from the column beside it', async() => {
    const control = await controlRowHeights({ mergeCells: MERGE }, LINES);

    await grid.build({ mergeCells: MERGE, hiddenColumns: { columns: [4] } }, { ...AT_MERGE, value: LINES });
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    await grid.callPlugin('hiddenColumns', 'showColumns', [4]);

    await expect.poll(() => grid.rowHeights()).toEqual(control);
  });

  test('a new text in the first cell of a merge drawn on the row below', async() => {
    const settings = { mergeCells: MERGE, hiddenRows: { rows: [1] } };

    // The text is short, so the block grows no row.
    await grid.build(settings, { ...AT_MERGE, value: 'short' });
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    await grid.setDataAtCell(AT_MERGE.row, AT_MERGE.col, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
  });

  test('trimming the row a merge is drawn on moves the block to the next row', async() => {
    const control = await controlRowHeights({ mergeCells: TALL_MERGE }, LINES);

    await grid.build({ mergeCells: TALL_MERGE, hiddenRows: { rows: [1] }, trimRows: true }, { ...AT_MERGE, value: LINES });
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    // The block was drawn on row 2 and now is drawn on row 3, which has not held its text yet.
    await grid.callPlugin('trimRows', 'trimRows', [2]);

    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(Math.max(...control));
  });

  test('hiding the first row of a merge below the fold, then scrolling to it', async() => {
    // A full render measures every row it draws, so a row in view is measured again whatever the cache holds.
    // A row below the fold is measured only when the cache is dropped, and scrolling measures nothing.
    const rows = 50;
    const text = { row: 44, col: 4, value: LINES };
    const settings = {
      mergeCells: [{ row: 44, col: 4, rowspan: 2, colspan: 2 }],
      dataRows: rows,
      height: 300,
    };

    await grid.build({ ...settings, hiddenRows: true }, text);
    await grid.callPlugin('hiddenRows', 'hideRows', [44]);

    await grid.scrollToEnd(rows - 1);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
  });

  test('a new text in a merge below the fold that is drawn on the row below its hidden first row', async() => {
    // The edit queues the row the block is drawn on. That row is below the fold, so no render measures it,
    // and scrolling measures nothing.
    const rows = 50;
    const settings = {
      mergeCells: [{ row: 44, col: 4, rowspan: 2, colspan: 2 }],
      hiddenRows: { rows: [44] },
      dataRows: rows,
      height: 300,
    };

    await grid.build(settings, { row: 44, col: 4, value: 'short' });
    await grid.setDataAtCell(44, 4, LINES);

    await grid.scrollToEnd(rows - 1);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
  });
});
