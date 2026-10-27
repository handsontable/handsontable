import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AutoColumnSizeMergedCellsPage } from '../fixtures/pages/AutoColumnSizeMergedCellsPage';

const LONG = 'A very long string that will not fit into the cell so it needs more space';
const FITS = { fits: true, tight: true };

/**
 * Reads whether the columns a merge spans fit its text (`control`, the width of the same text in an
 * unmerged column) and no more than that, with one pixel of rounding.
 *
 * @param {number[]} widths The column widths.
 * @param {number} from The first spanned column.
 * @param {number} span The number of spanned columns.
 * @param {number} control The width of the text measured unmerged.
 * @returns {object}
 */
function fitOf(widths: number[], from: number, span: number, control: number) {
  const sum = widths.slice(from, from + span).reduce((total, width) => total + width, 0);

  return { fits: sum >= control, tight: sum <= control + 1 };
}

/**
 * AutoColumnSize must size columns from the content of a merged cell, which it used to skip
 * entirely: the merge's top-left cell was sampled as an empty string, so the text wrapped into a
 * 50px column. A merge that spans one column is measured like any cell. A merge that spans several
 * columns widens its first column by what the spanned columns lack, and never more, so the text no
 * longer makes that first column as wide as the whole text on its own.
 *
 * Every case measures an unmerged control first, in the same theme and bundle, because the text
 * width is the theme's.
 */
test.describe('autoColumnSize and merged cells', { tag: THEMES_TAG }, () => {
  let grid: AutoColumnSizeMergedCellsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeMergedCellsPage(page, theme, bundle);
    await grid.goto();
  });

  test('sizes a column from a merge that spans rows only', async() => {
    const data = [[LONG, 'x'], ['', 'y'], ['', 'z']];
    const [control] = await grid.build({ data });

    expect(control).toBeGreaterThan(300);

    const [merged] = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }] });

    expect(merged).toBe(control);
  });

  test('widens the columns a merge spans until they fit its content, and no further', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });
    const [first, second] = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });

    expect(first + second).toBeGreaterThanOrEqual(control);
    expect(first + second).toBeLessThanOrEqual(control + 1);
    // The 2015 behavior made the first column as wide as the whole text on its own.
    expect(first).toBeLessThan(control);
    // What the user sees: the merged text no longer wraps.
    expect(await grid.fitsOnOneLine(0, 0, 1)).toBe(true);
  });

  test('takes a spanned column with a fixed width into account', async() => {
    const data = [[LONG, ''], ['a', 'b'], ['c', 'd']];
    const [control] = await grid.build({ data });
    const [first, second] = await grid.build({
      data,
      columns: [{}, { width: 100 }],
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
    });

    expect(second).toBe(100);
    expect(Math.abs(first - (control - 100))).toBeLessThanOrEqual(1);
  });

  test('keeps the first column when the spanned columns are already wide enough', async() => {
    const data = [['ab', ''], ['x', LONG]];
    const control = await grid.build({ data });
    const merged = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });

    expect(merged).toEqual(control);
  });

  test('counts a hidden column inside the span as zero', async() => {
    const data = [[LONG, 'hidden content', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });
    const [first, hidden, third] = await grid.build({
      data,
      hiddenColumns: { columns: [1] },
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }],
    });

    expect(hidden).toBe(0);
    expect(Math.abs(first + third - control)).toBeLessThanOrEqual(1);
  });

  test('re-measures when a range is merged and unmerged at runtime', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data, mergeCells: true });

    await grid.merge(0, 0, 0, 1);
    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return { fits: first + second >= control, firstNarrower: first < control };
    }).toEqual({ fits: true, firstNarrower: true });

    await grid.unmerge(0, 0, 0, 1);
    await expect.poll(async() => (await grid.widths())[0]).toBe(control);
  });

  test('re-measures when the content of a merge changes', async() => {
    const data = [['ab', ''], ['a', 'b']];
    const [control] = await grid.build({ data: [[LONG, ''], ['a', 'b']] });
    const [short] = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });

    expect(short).toBeLessThan(control / 2);

    await grid.setDataAtCell(0, 0, LONG);
    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);

    await grid.setDataAtCell(0, 0, 'ab');
    await expect.poll(async() => (await grid.widths())[0]).toBe(short);
  });

  test('narrows the first column again when a spanned column grows on its own', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });
    const [merged] = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });

    expect(merged).toBeGreaterThan(control / 2);

    await grid.setDataAtCell(1, 1, `${LONG} and then some`);
    await expect.poll(async() => (await grid.widths())[0]).toBeLessThan(control / 2);
  });

  test('follows a merge whose columns move when a column is inserted before it', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.insertColumnBefore(0);

    await expect.poll(async() => {
      const [inserted, first, second] = await grid.widths();

      return { insertedNarrow: inserted < control / 2, ...fitOf([first, second], 0, 2, control) };
    }).toEqual({ insertedNarrow: true, ...FITS });
  });

  test('fits a merge again after the data is replaced', async() => {
    const [control] = await grid.build({ data: [[LONG, ''], ['a', 'b']] });

    await grid.build({ data: [['ab', ''], ['a', 'b']], mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.loadData([[LONG, ''], ['a', 'b']]);

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
    expect(await grid.fitsOnOneLine(0, 0, 1)).toBe(true);
  });

  test('fits a merge again after the data is updated in place', async() => {
    const [control] = await grid.build({ data: [[LONG, ''], ['a', 'b']] });

    await grid.build({ data: [['ab', ''], ['a', 'b']], mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.updateData([[LONG, ''], ['a', 'b']]);

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('widens the first visible column when the merge\'s first column is hidden', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });
    const [hidden, second, third] = await grid.build({
      data,
      hiddenColumns: { columns: [0] },
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }],
    });

    expect(hidden).toBe(0);
    expect(second + third).toBeGreaterThanOrEqual(control);
  });

  test('ignores a merge in a hidden row', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });
    const [first] = await grid.build({
      data,
      hiddenRows: { rows: [0] },
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
    });

    expect(first).toBeLessThan(control / 2);
  });

  test('measures a column again when its merge is removed through the settings', async() => {
    const data = [Array.from({ length: 30 }, (_, column) => (column === 20 ? LONG : `c${column}`))];
    const [control] = (await grid.build({ data, width: 400 })).slice(20);

    await grid.build({ data, width: 400, mergeCells: [{ row: 0, col: 20, rowspan: 1, colspan: 2 }] });
    // The merge is off screen, and the settings remove it without an unmerge hook.
    await grid.updateSettings({ mergeCells: false });
    await grid.scrollToColumn(20);

    await expect.poll(async() => (await grid.widths())[20]).toBe(control);
  });

  test('fits a merge in a column measured after the synchronous limit', async() => {
    const data = [Array.from({ length: 30 }, (_, column) => (column === 20 ? LONG : '')), Array(30).fill('a')];
    const [control] = (await grid.build({ data, autoColumnSize: { syncLimit: 2 } })).slice(20);

    await grid.build({
      data,
      autoColumnSize: { syncLimit: 2 },
      mergeCells: [{ row: 0, col: 20, rowspan: 1, colspan: 2 }],
    });

    await expect.poll(async() => fitOf(await grid.widths(), 20, 2, control)).toEqual(FITS);
  });

  test('sizes a merge on a stretched grid from the widths before the stretch', async() => {
    const [control] = await grid.build({ data: [[LONG]] });
    const data = [['ab', '', '', '', '', '', '', ''], Array(8).fill('a')];
    const merge = [{ row: 0, col: 0, rowspan: 1, colspan: 2 }];

    // The grid settles stretched first, so the fit that the edit triggers finds the columns stretched.
    await grid.build({ data, width: 600, stretchH: 'all', mergeCells: merge });
    await grid.setDataAtCell(0, 0, LONG);

    // The stretch adds room on top, so only the lower bound holds here.
    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control).fits).toBe(true);
    expect(await grid.fitsOnOneLine(0, 0, 1)).toBe(true);
  });

  test('keeps the widths of a stretched grid from one render to the next', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];

    await grid.build({
      data,
      width: 1200,
      stretchH: 'all',
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
    });

    const settled = await grid.widths();

    await grid.render();
    await grid.render();

    expect(await grid.widths()).toEqual(settled);
  });

  test('fits a merge whose row is shown again at runtime', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    await grid.build({ data, hiddenRows: { rows: [0] }, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.callPlugin('hiddenRows', 'showRows', [0]);

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('moves the room to the first visible column when the first column is hidden at runtime', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });

    await grid.build({ data, hiddenColumns: { columns: [] }, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }] });
    await grid.callPlugin('hiddenColumns', 'hideColumns', [0]);

    await expect.poll(async() => fitOf(await grid.widths(), 1, 2, control)).toEqual(FITS);
  });

  test('fits a merge again when an edit of its text is undone', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.setDataAtCell(0, 0, 'ab');
    await expect.poll(async() => (await grid.widths())[0]).toBeLessThan(control / 2);

    await grid.callPlugin('undoRedo', 'undo');

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('fits the merges again when autoColumnSize is turned off and on', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const merged = await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });

    await grid.updateSettings({ autoColumnSize: false });
    await grid.updateSettings({ autoColumnSize: true });

    await expect.poll(() => grid.widths()).toEqual(merged);
  });

  test('fits a merge again when a column it spans is resized by hand', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    const [, before] = await grid.build({
      data,
      manualColumnResize: true,
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
    });

    await grid.dragColumnResizeHandle(1, 150);

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return { grown: second > before + 100, fits: first + second >= control, tight: first + second <= control + 1 };
    }).toEqual({ grown: true, fits: true, tight: true });
  });

  test('fits a merge made at runtime on a grid without row headers', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data, rowHeaders: false });

    await grid.build({ data, rowHeaders: false, mergeCells: true });
    await grid.merge(0, 0, 0, 1);

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
    expect(await grid.fitsOnOneLine(0, 0, 1)).toBe(true);
  });

  test('restores the column when a merge is undone', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data, mergeCells: true });

    await grid.merge(0, 0, 0, 1);
    await expect.poll(async() => (await grid.widths())[0]).toBeLessThan(control);

    await grid.callPlugin('undoRedo', 'undo');

    await expect.poll(async() => (await grid.widths())[0]).toBe(control);
  });

  test('fits a merge again when the cell meta of its first cell changes', async() => {
    const [bigControl] = await grid.build({ data: [[LONG]], cell: [{ row: 0, col: 0, className: 'big-text' }] });

    await grid.build({ data: [[LONG, ''], ['a', 'b']], mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.setCellMeta(0, 0, 'className', 'big-text');

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, bigControl)).toEqual(FITS);
  });

  test('fits a merge again when the settings restyle its first cell', async() => {
    const [bigControl] = await grid.build({ data: [[LONG]], cell: [{ row: 0, col: 0, className: 'big-text' }] });
    const merge = [{ row: 0, col: 0, rowspan: 1, colspan: 2 }];

    await grid.build({ data: [[LONG, ''], ['a', 'b']], mergeCells: merge });
    await grid.updateSettings({ cell: [{ row: 0, col: 0, className: 'big-text' }] });

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, bigControl)).toEqual(FITS);
  });

  test('fits a merge again when a column it spans is sized through the API', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });

    await grid.build({ data, manualColumnResize: true, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }] });
    await grid.callPlugin('manualColumnResize', 'setManualSize', 1, 300);
    await expect.poll(async() => fitOf(await grid.widths(), 0, 3, control)).toEqual(FITS);

    await grid.callPlugin('manualColumnResize', 'setManualSize', 1, 40);
    await expect.poll(async() => fitOf(await grid.widths(), 0, 3, control)).toEqual(FITS);
  });

  test('keeps a merge fitted when the rows are sorted', async() => {
    const data = [[LONG, '', 'b'], ['a', 'b', 'c'], ['c', 'd', 'a']];
    const [control] = await grid.build({ data });

    await grid.build({ data, columnSorting: true, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.callPlugin('columnSorting', 'sort', { column: 2, sortOrder: 'asc' });

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('follows a merge whose columns move', async() => {
    const data = [[LONG, '', 'x'], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });

    await grid.build({ data, manualColumnMove: true, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.callPlugin('manualColumnMove', 'moveColumn', 2, 0);

    await expect.poll(async() => fitOf(await grid.widths(), 1, 2, control)).toEqual(FITS);
  });

  test('follows a merge when a column before it is removed', async() => {
    const data = [['x', LONG, ''], ['a', 'b', 'c']];
    const [, control] = await grid.build({ data });

    await grid.build({ data, mergeCells: [{ row: 0, col: 1, rowspan: 1, colspan: 2 }] });
    await grid.removeColumn(0);

    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('drops and restores the room of a merge whose row is trimmed and untrimmed', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    await grid.build({ data, trimRows: true, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.callPlugin('trimRows', 'trimRows', [0]);
    await expect.poll(async() => (await grid.widths())[0]).toBeLessThan(control / 2);

    await grid.callPlugin('trimRows', 'untrimRows', [0]);
    await expect.poll(async() => fitOf(await grid.widths(), 0, 2, control)).toEqual(FITS);
  });

  test('fits a merge again when an unmerge is undone and redone', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });

    await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }] });
    await expect.poll(async() => fitOf(await grid.widths(), 0, 3, control)).toEqual(FITS);

    await grid.unmerge(0, 0, 0, 2);
    await expect.poll(async() => (await grid.widths())[0]).toBe(control);

    // The undo brings the merge back through MergeCells' state, with no merge hook.
    await grid.callPlugin('undoRedo', 'undo');
    await expect.poll(async() => fitOf(await grid.widths(), 0, 3, control)).toEqual(FITS);

    await grid.callPlugin('undoRedo', 'redo');
    await expect.poll(async() => (await grid.widths())[0]).toBe(control);
  });

  test('fits a merge again when the styles change before a render', async() => {
    // The plain column 3 holds the same text, so it gives the expected width under any style.
    const data = [[LONG, '', '', ''], ['a', 'b', 'c', LONG]];

    await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await expect.poll(async() => {
      const widths = await grid.widths();

      return fitOf(widths, 0, 2, widths[3]);
    }).toEqual(FITS);

    const before = (await grid.widths())[3];

    await grid.addStyle('.handsontable td { font-size: 22px; }');
    await grid.render();

    await expect.poll(async() => {
      const widths = await grid.widths();

      return { grown: widths[3] > before, ...fitOf(widths, 0, 2, widths[3]) };
    }).toEqual({ grown: true, ...FITS });
  });
});
