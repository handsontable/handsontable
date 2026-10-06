import { test, expect } from '../fixtures/test';
import { MergedCellsFrozenColumnsPage } from '../fixtures/pages/MergedCellsFrozenColumnsPage';

/**
 * A merged block that crosses a frozen-column line is rendered twice: by the master, at its full width,
 * and by the frozen pane, whose table holds the frozen columns only, so the browser cut the clone's
 * cell at the freeze line. Alignment and wrapping were then computed against the cut width: a
 * right-aligned or centered value showed once in each pane, and a long value wrapped in the narrow
 * frozen part and made that pane's row taller than the master's. Each pane now lays the content out
 * at the block's full width and shows its own slice of it.
 *
 * The content is fixed-size markers (see the fixture), so positions do not depend on font metrics.
 */
test.describe('content of a merged cell across a frozen-column line', () => {
  let grid: MergedCellsFrozenColumnsPage;

  // Crosses the `fixedColumnsStart: 2` line: two frozen columns and four in the master, so the whole
  // block fits inside the 600px grid and its far end is on screen.
  const BLOCK = { row: 1, col: 0, rowspan: 1, colspan: 6 };
  const ONE_MARKER = [{ row: 1, col: 0, value: 'markers:1' }];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new MergedCellsFrozenColumnsPage(page, theme, bundle);
    await grid.goto();
  });

  for (const className of ['htRight', 'htCenter', 'htLeft']) {
    test(`shows a ${className} value once`, async () => {
      await grid.initGrid({
        fixedColumnsStart: 2,
        mergeCells: [BLOCK],
        values: ONE_MARKER,
        cell: [{ row: 1, col: 0, className }],
      });

      await expect.poll(() => grid.visibleMarkers()).toEqual({ count: 1, panes: [expect.any(String)] });
    });
  }

  test('shows a right-aligned value in the master after a horizontal scroll', async () => {
    // The block ends at column 11, still on screen after the scroll: the value belongs at that end,
    // where the master draws it, not at the freeze line.
    await grid.initGrid({
      fixedColumnsStart: 2,
      mergeCells: [{ ...BLOCK, colspan: 12 }],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });
    await grid.scrollToColumn(6);

    await expect.poll(() => grid.visibleMarkers()).toEqual({ count: 1, panes: ['ht_master'] });
  });

  test('shows a value once with the legacy fixedColumnsLeft option', async () => {
    await grid.initGrid({
      fixedColumnsLeft: 2,
      mergeCells: [BLOCK],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once in a right-to-left grid', async () => {
    // In RTL the frozen columns are on the right, so a left-aligned value sits at the block's far end.
    await grid.initGrid({
      layoutDirection: 'rtl',
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htLeft' }],
    });

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once when the block reaches into the fixedColumnsEnd band', async () => {
    // 30 columns, the last two frozen at the end: the block starts in the master and ends in the band.
    await grid.initGrid({
      fixedColumnsEnd: 2,
      mergeCells: [{ row: 1, col: 22, rowspan: 1, colspan: 8 }],
      values: [{ row: 1, col: 22, value: 'markers:1' }],
    });
    await grid.scrollToColumn(22);

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once when the block reaches into the fixedColumnsEnd band of a right-to-left grid', async () => {
    await grid.initGrid({
      layoutDirection: 'rtl',
      fixedColumnsEnd: 2,
      mergeCells: [{ row: 1, col: 22, rowspan: 1, colspan: 8 }],
      values: [{ row: 1, col: 22, value: 'markers:1' }],
    });
    await grid.scrollToColumn(22);

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once with virtualized merged cells', async () => {
    await grid.initGrid({
      fixedColumnsStart: 2,
      mergeCells: { virtualized: true, cells: [BLOCK] },
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once in the frozen top-start corner', async () => {
    // Row 1 is frozen at the top too, so the frozen part of the block is drawn by the corner overlay.
    await grid.initGrid({
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      mergeCells: [BLOCK],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });

    await expect.poll(() => grid.visibleMarkers()).toEqual({ count: 1, panes: ['ht_clone_top'] });
  });

  test('shows a value once when a column inside the block is hidden', async () => {
    await grid.initGrid({
      fixedColumnsStart: 2,
      hiddenColumns: { columns: [3] },
      mergeCells: [{ ...BLOCK, colspan: 7 }],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('shows a value once in a right-to-left grid when the renderer sets the cell direction to ltr', async () => {
    // The numeric and time renderers do this: the wrapper must grow toward the rest of the block whatever
    // direction the cell itself has.
    await grid.initGrid({
      layoutDirection: 'rtl',
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: [{ row: 1, col: 0, value: 'ltr:1' }],
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });

    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('starts the inline-end layout wrapper where the master\'s block cell starts once scrolled to the end', async () => {
    // At the end of the scroll the end clone stands over the master's own last columns, so the two copies of the
    // block's content have to line up. (Mid-scroll the clone is pinned elsewhere and nothing lines up with it.)
    // The first cell of the clone draws the freeze line as a border only mid-scroll, which is why this is the
    // state that pins the wrapper's start.
    await grid.initGrid({
      fixedColumnsEnd: 2,
      mergeCells: [{ row: 1, col: 16, rowspan: 1, colspan: 14 }],
      values: [{ row: 1, col: 16, value: 'markers:1' }],
    });
    await grid.scrollToEnd(29);

    await expect.poll(async () => Math.abs((await grid.inlineEndWrapperDrift()) ?? NaN)).toBeLessThan(0.5);
  });

  test('repaints a crossing block when a column inside it is resized under renderMode onChange', async () => {
    await grid.initGrid({
      renderMode: 'onChange',
      manualColumnResize: true,
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: ONE_MARKER,
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });
    await expect.poll(async () => Math.abs((await grid.startWrapperWidthDrift()) ?? NaN)).toBeLessThan(0.5);

    await grid.resizeColumn(4, 160);

    // The wrapper is a pixel width taken from the block's columns when it was painted: the block got 100px
    // wider, and a pane that was not repainted would still be 100px short of it.
    await expect.poll(async () => Math.abs((await grid.startWrapperWidthDrift()) ?? NaN)).toBeLessThan(0.5);
    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('keeps one layout wrapper when a hook wraps the cell content in a link after the plugin', async () => {
    await grid.initGrid({
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: [{ row: 1, col: 0, value: 'linked:1' }],
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });
    await grid.render(3);

    expect(await grid.contentWindows()).toEqual({ count: 1, nested: 0 });
    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);
  });

  test('keeps one layout wrapper when a renderer keeps its DOM across paints', async () => {
    await grid.initGrid({
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: [{ row: 1, col: 0, value: 'kept:1' }],
      cell: [{ row: 1, col: 0, className: 'htRight' }],
    });
    await grid.render(3);

    expect(await grid.contentWindows()).toEqual({ count: 1, nested: 0 });
    await expect.poll(async () => (await grid.visibleMarkers()).count).toBe(1);

    // Once the block no longer crosses a freeze line, the wrapper goes away with it.
    await grid.updateSettings({ fixedColumnsStart: 0 });

    await expect.poll(() => grid.contentWindows()).toEqual({ count: 0, nested: 0 });
  });

  test('wraps a long value at the block width, so the frozen row is as tall as the master row', async () => {
    // Six markers (44px each) fit on one line across the block (360px) but wrap into three lines
    // across the two frozen columns (120px).
    await grid.initGrid({
      fixedColumnsStart: 2,
      mergeCells: [BLOCK],
      values: [{ row: 1, col: 0, value: 'markers:6' }],
    });

    await expect.poll(() => grid.rowsDisagreeingWithMaster([0, 1, 2, 3])).toEqual([]);
    expect(await grid.masterRowHeight(1)).toBe(await grid.masterRowHeight(2));
  });
});
