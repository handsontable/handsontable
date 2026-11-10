import { test, expect, THEMES_TAG } from '../fixtures/test';
import {
  AutoRowSizeMergedHiddenOriginPage,
  type GridSettings,
} from '../fixtures/pages/AutoRowSizeMergedHiddenOriginPage';

/**
 * With AutoRowSize on, a merge whose first rows are trimmed or filtered out is drawn from the next visible
 * row. A row or column move that splits a merge can draw a fragment from another cell the same way. That cell
 * was covered by the merge before, so MergeCells had stored `hidden` on it, and the sampler skipped it: the text
 * written into it afterwards was never measured. The master grew to the text and the row headers kept the
 * default height.
 *
 * Every case builds the merge `{ row: 1, col: 4, rowspan: 3, colspan: 2 }` over 10 x 10 spreadsheet data,
 * hides or removes the merge's first row or rows, and then writes text into the cell the merge is drawn from. It expects
 * two things. Every row header is as tall as its row. And the row the merge is drawn on is as tall as in a
 * control grid that has the same block built in place, with nothing trimmed: that tells a measurement of the
 * text at the block's width from no measurement, because both panes read the same stored height and stay
 * aligned whatever it is.
 */
const LINES = 'line one\nline two\nline three\nline four';
const TALL_MERGE = [{ row: 1, col: 4, rowspan: 3, colspan: 2 }];
// A row grown by the merge's text is at least this much taller than a plain row, on every theme. The
// precondition: with no row grown, every comparison of the two panes passes on code that has the bug.
const GROWN_BY_AT_LEAST = 10;

test.describe('row headers beside a merge that a trim or a filter drew from another row', { tag: THEMES_TAG }, () => {
  let grid: AutoRowSizeMergedHiddenOriginPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoRowSizeMergedHiddenOriginPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Builds the control grid: the block the trim leaves, made in place with nothing hidden, and the text in
   * its first cell. Returns the height of the tallest row once it has settled.
   */
  async function controlTallestRow(settings: GridSettings, row: number): Promise<number> {
    await grid.build(settings, { row, col: 4, value: LINES });
    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);

    return Math.max(...await grid.rowHeights());
  }

  const tallestRow = async() => Math.max(...await grid.rowHeights());

  test('control: the block made in place keeps every row header as tall as its row', async() => {
    await controlTallestRow({ mergeCells: [{ row: 2, col: 4, rowspan: 2, colspan: 2 }] }, 2);
  });

  test('trimming the first row of the merge, then writing the text', async() => {
    const control = await controlTallestRow({ mergeCells: [{ row: 2, col: 4, rowspan: 2, colspan: 2 }] }, 2);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE, trimRows: true });
    await grid.callPlugin('trimRows', 'trimRows', [1]);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
  });

  test('trimming the first two rows of the merge, then writing the text', async() => {
    const control = await controlTallestRow({ mergeCells: [{ row: 3, col: 4, rowspan: 1, colspan: 2 }] }, 3);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE, trimRows: true });
    await grid.callPlugin('trimRows', 'trimRows', [1, 2]);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
  });

  test('filtering out the first row of the merge, then writing the text', async() => {
    const control = await controlTallestRow({ mergeCells: [{ row: 2, col: 4, rowspan: 2, colspan: 2 }] }, 2);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE, filters: true });
    // Row 1 of the spreadsheet data holds `A2` in the first column.
    await grid.filterOutValue(0, 'A2');
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
  });

  test('removing the first row of the merge, then writing the text', async() => {
    // The merge keeps its other two rows and is drawn from the row that followed the removed one.
    const control = await controlTallestRow({ mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 2 }] }, 1);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE });
    await grid.removeRow(1);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
  });

  test('moving the first row of the merge down, then writing the text', async() => {
    // The move splits the merge: two of its rows stay together, drawn from the row that followed the moved one.
    const control = await controlTallestRow({ mergeCells: [{ row: 1, col: 4, rowspan: 2, colspan: 2 }] }, 1);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE, manualRowMove: true });
    await grid.callPlugin('manualRowMove', 'moveRow', 1, 6);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
    // A copy quotes a value that holds line breaks.
    expect(await grid.copyableText(1, 4)).toBe(`"${LINES}"`);
  });

  test('moving the first column of the merge away, then writing the text', async() => {
    // The move leaves the merge's second column alone: a block of one column and three rows.
    const control = await controlTallestRow({ mergeCells: [{ row: 1, col: 4, rowspan: 3, colspan: 1 }] }, 1);

    await grid.buildWithoutText({ mergeCells: TALL_MERGE, manualColumnMove: true });
    await grid.callPlugin('manualColumnMove', 'moveColumn', 4, 8);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
    await expect.poll(tallestRow).toBe(control);
    // A copy quotes a value that holds line breaks.
    expect(await grid.copyableText(1, 4)).toBe(`"${LINES}"`);
  });

  // A guard, not a repro of the bug: the untrim makes the original cell the top-left again, and that cell never
  // held `hidden`, so this case passes without the fix. It fails if the fix clears more than it should.
  test('trimming the first row, then untrimming it, keeps every row header as tall as its row', async() => {
    await grid.buildWithoutText({ mergeCells: TALL_MERGE, trimRows: true });
    await grid.callPlugin('trimRows', 'trimRows', [1]);
    await grid.callPlugin('trimRows', 'untrimRows', [1]);
    await grid.setDataAtCell(1, 4, LINES);

    await expect.poll(() => grid.tallestRowExtra()).toBeGreaterThan(GROWN_BY_AT_LEAST);
    await expect.poll(() => grid.misalignedRows()).toEqual([]);
  });
});
