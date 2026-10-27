import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AutoColumnSizeMergedCellsPage } from '../fixtures/pages/AutoColumnSizeMergedCellsPage';

const LONG = 'A very long string that will not fit into the cell so it needs more space';

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
    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);

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

      return { insertedNarrow: inserted < control / 2, fits: first + second >= control };
    }).toEqual({ insertedNarrow: true, fits: true });
  });

  test('fits a merge again after the data is replaced', async() => {
    const [control] = await grid.build({ data: [[LONG, ''], ['a', 'b']] });

    await grid.build({ data: [['ab', ''], ['a', 'b']], mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.loadData([[LONG, ''], ['a', 'b']]);

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);
    expect(await grid.fitsOnOneLine(0, 0, 1)).toBe(true);
  });

  test('fits a merge again after the data is updated in place', async() => {
    const [control] = await grid.build({ data: [[LONG, ''], ['a', 'b']] });

    await grid.build({ data: [['ab', ''], ['a', 'b']], mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.updateData([[LONG, ''], ['a', 'b']]);

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);
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

    await expect.poll(async() => {
      const widths = await grid.widths();

      return widths[20] + widths[21] >= control;
    }).toBe(true);
  });

  test('sizes a merge on a stretched grid from the widths before the stretch', async() => {
    const [control] = await grid.build({ data: [[LONG]] });
    const data = [['ab', '', '', '', '', '', '', ''], Array(8).fill('a')];
    const merge = [{ row: 0, col: 0, rowspan: 1, colspan: 2 }];

    // The grid settles stretched first, so the fit that the edit triggers finds the columns stretched.
    await grid.build({ data, width: 600, stretchH: 'all', mergeCells: merge });
    await grid.setDataAtCell(0, 0, LONG);

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);
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

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);
  });

  test('moves the room to the first visible column when the first column is hidden at runtime', async() => {
    const data = [[LONG, '', ''], ['a', 'b', 'c']];
    const [control] = await grid.build({ data });

    await grid.build({ data, hiddenColumns: { columns: [] }, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 3 }] });
    await grid.callPlugin('hiddenColumns', 'hideColumns', [0]);

    await expect.poll(async() => {
      const [, second, third] = await grid.widths();

      return second + third >= control;
    }).toBe(true);
  });

  test('fits a merge again when an edit of its text is undone', async() => {
    const data = [[LONG, ''], ['a', 'b']];
    const [control] = await grid.build({ data });

    await grid.build({ data, mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
    await grid.setDataAtCell(0, 0, 'ab');
    await expect.poll(async() => (await grid.widths())[0]).toBeLessThan(control / 2);

    await grid.callPlugin('undoRedo', 'undo');

    await expect.poll(async() => {
      const [first, second] = await grid.widths();

      return first + second >= control;
    }).toBe(true);
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
});
