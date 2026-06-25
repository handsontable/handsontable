describe('Cell meta eviction on viewport exit', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // The grid renders only a small viewport (~17 data rows at 400px in the main theme), so the
  // `DynamicCellMetaMod` only materializes cell meta for the visible rows plus a one-viewport
  // hysteresis margin above and below ("keep band"). Vertical scrolling evicts the render-derived
  // meta for rows that leave that band.
  const ROWS = 5000;
  const COLS = 20;
  const HEIGHT = 400;

  // Scrolls the viewport so `row` sits at the top, then waits for the render to settle. A vertical
  // scroll is what fires `afterScrollVertically`, which drives the eviction.
  async function scrollToRow(row) {
    await scrollViewportTo({ row, verticalSnap: 'top' });
    await render();
  }

  // Drops `targetRow` out of the keep band (about one viewport of hysteresis on each side) by
  // jumping several viewports away, then scrolls back to it. Direct jumps are enough: each vertical
  // scroll fires `afterScrollVertically`, which evicts the band that was left behind. Jumping (vs
  // step-scrolling the whole dataset) keeps the test to a handful of render cycles.
  async function scrollAwayAndBack(targetRow) {
    const viewport = Math.max(1, expectedVisibleRows(HEIGHT, 0));
    const farAway = targetRow > (ROWS / 2)
      ? Math.max(0, targetRow - (viewport * 4))
      : Math.min(ROWS - 1, targetRow + (viewport * 4));

    await scrollToRow(farAway);
    await scrollToRow(targetRow);
  }

  it('should fire `afterScrollVertically` when the viewport scrolls (eviction trigger sanity check)', async() => {
    // This is the load-bearing assumption for every other test in this file: the eviction logic is
    // driven by `afterScrollVertically`. If `scrollViewportTo` did not fire it, the other tests
    // would pass while exercising nothing. Lock the trigger in explicitly.
    const afterScrollVertically = jasmine.createSpy('afterScrollVertically');

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
      afterScrollVertically,
    });

    await scrollViewportTo({ row: 100, verticalSnap: 'top' });
    await render();

    expect(afterScrollVertically).toHaveBeenCalled();
  });

  it('should keep materialized cell meta bounded while scrolling through a large dataset', async() => {
    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
    });

    // Touch every cell's meta in the initial viewport so the band is populated before scrolling.
    await render();

    // Visit positions spread across the whole dataset. Each far jump fires `afterScrollVertically`
    // and evicts the band left behind, so only the final band's meta should remain materialized.
    // Without eviction these scattered bands would accumulate well past the bound asserted below.
    const stops = 15;

    for (let i = 1; i <= stops; i++) {
      await scrollToRow(Math.round((ROWS - 1) * i / stops));
    }

    const materializedCount = getCellsMeta().length;

    // The keep band is roughly (visible rows + 2 viewports of hysteresis) wide, i.e. about three
    // viewports of rows, times the column count. We derive the bound at runtime from the live
    // viewport size so the assertion stays theme-agnostic (a denser theme shows more rows, which
    // widens the band and raises this number). The generous 8x multiplier proves boundedness
    // without being brittle: without eviction this would be ~ROWS * COLS (tens of thousands), far
    // above any multiple of a single viewport.
    const visibleRows = expectedVisibleRows(HEIGHT, 0);
    const bound = visibleRows * COLS * 8;

    expect(materializedCount).toBeLessThan(bound);
    // Sanity floor: the current viewport's meta must still be materialized.
    expect(materializedCount).toBeGreaterThan(0);
  }, 30000); // Fine-grained full-dataset traversal runs many render cycles; raise the timeout.

  it('should never evict cell meta set imperatively via `setCellMeta`', async() => {
    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
    });

    // Pick a middle row so it is scrolled INTO the keep band and then back OUT of it - a row from
    // the initial viewport is never part of a tracked band, so it would survive trivially and prove
    // nothing about the eviction path.
    const targetRow = 2500;

    await scrollViewportTo({ row: targetRow, verticalSnap: 'top' });
    await render();
    await setCellMeta(targetRow, 3, 'className', 'my-custom-class');

    expect(getCellMeta(targetRow, 3).className).toBe('my-custom-class');

    // Scroll far enough away that the row drops out of the keep band, then back.
    await scrollAwayAndBack(targetRow);

    expect(getCellMeta(targetRow, 3).className).toBe('my-custom-class');
  });

  it('should never evict cell meta set declaratively via the `cell` option', async() => {
    const targetRow = 3000;

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
      cell: [
        { row: targetRow, col: 2, className: 'declared-class' },
      ],
    });

    await render();

    expect(getCellMeta(targetRow, 2).className).toBe('declared-class');

    await scrollAwayAndBack(targetRow);

    expect(getCellMeta(targetRow, 2).className).toBe('declared-class');
  });

  it('should keep the correct resolved meta after a cell scrolls out of the band and back', async() => {
    // The type is assigned by a `cells` function (NOT a column `type`). A column type lives in the
    // columnMeta cascade and would be inherited correctly on re-mint even if the memo were never
    // cleared - so it would not exercise the metaSyncMemo eviction. With `cells`, the type is added
    // by the dynamic extension, which short-circuits on the per-render memo; if eviction did not
    // clear that memo entry, the re-minted cell would silently miss its type and renderer.
    const targetRow = 2750;
    const targetCol = 5;

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
      cells(physicalRow, physicalColumn) {
        if (physicalRow === targetRow && physicalColumn === targetCol) {
          return { type: 'numeric' };
        }

        return {};
      },
    });

    await render();

    // Scroll the cell into the band, confirm its resolved type, then scroll it out and back.
    await scrollToRow(targetRow);

    const metaBefore = getCellMeta(targetRow, targetCol);

    expect(metaBefore.type).toBe('numeric');

    await scrollAwayAndBack(targetRow);

    const metaAfter = getCellMeta(targetRow, targetCol);

    // The cell was evicted while out of the band, so the re-minted meta must be a NEW object - this
    // proves eviction actually happened and the test is not passing vacuously on a kept object.
    expect(metaAfter).not.toBe(metaBefore);
    // `type` is always a resolved string, so it is the robust correctness lock.
    expect(metaAfter.type).toBe('numeric');
    // The resolved renderer may be a string or a function depending on the build; assert it matches
    // the pre-eviction resolution rather than guessing its form.
    expect(metaAfter.renderer).toBe(metaBefore.renderer);
  });

  it('should protect the selected cell during scroll and keep its editing working', async() => {
    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
    });

    const targetRow = 2200;
    const targetCol = 4;

    await scrollViewportTo({ row: targetRow, verticalSnap: 'top' });
    await render();
    await selectCell(targetRow, targetCol);

    // Scroll the selected cell out of the band and back - it must not throw and must stay editable.
    await scrollAwayAndBack(targetRow);

    await selectCell(targetRow, targetCol);
    await keyDownUp('enter');

    expect(getActiveEditor().isOpened()).toBe(true);

    await keyDownUp('escape');

    expect(getSelectedLast()).toEqual([targetRow, targetCol, targetRow, targetCol]);
  });

  it('should not log console errors while scrolling through the dataset', async() => {
    spyOn(console, 'error');

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50, // disable autoColumnSize, which would otherwise materialize all cell meta at load
      rowHeights: 23,
    });

    await render();
    // Scroll down then back up to drive eviction passes in both directions.
    await scrollToRow(800);
    await scrollToRow(0);

    expect(console.error).not.toHaveBeenCalled(); // eslint-disable-line no-console
  });

  it('should keep a failed validation result (`valid === false`) after the cell scrolls out and back', async() => {
    const targetRow = 2600;
    const targetCol = 3;

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50,
      rowHeights: 23,
      allowInvalid: true,
      // Fails for the sentinel value only, so a single targeted invalid cell can be created.
      validator(value, callback) {
        callback(value !== 'BAD');
      },
    });

    await scrollViewportTo({ row: targetRow, verticalSnap: 'top' });
    await render();

    // Writing an invalid value runs the validator, which sets `valid = false` directly on the meta
    // object (not through `setMeta`) - exactly the case eviction must not drop.
    await setDataAtCell(targetRow, targetCol, 'BAD');

    expect(getCellMeta(targetRow, targetCol).valid).toBe(false);

    await scrollAwayAndBack(targetRow);

    // The invalid flag (and therefore the `htInvalid` highlight) must survive the round trip.
    expect(getCellMeta(targetRow, targetCol).valid).toBe(false);
  });

  it('should keep a search match highlighted after the cell scrolls out of the band and back', async() => {
    const targetRow = 2400;
    const targetCol = 2;
    const data = createSpreadsheetData(ROWS, COLS);

    data[targetRow][targetCol] = 'UNIQUEMATCH';

    handsontable({
      data,
      height: HEIGHT,
      colWidths: 50,
      rowHeights: 23,
      search: true,
    });

    // `search.query` flags matches via `isSearchResult` on cell meta (evicted with the cell); the
    // plugin also tracks matches in its own set so the highlight survives scrolling out of view.
    getPlugin('search').query('UNIQUEMATCH');
    await render();

    await scrollViewportTo({ row: targetRow, verticalSnap: 'top' });
    await render();

    expect(getCell(targetRow, targetCol).className).toContain('htSearchResult');

    await scrollAwayAndBack(targetRow);

    expect(getCell(targetRow, targetCol).className).toContain('htSearchResult');
  });

  it('should keep the columnSummary result styling after the cell scrolls out of the band and back', async() => {
    const summaryRow = 2500;
    const summaryCol = 1;

    handsontable({
      data: createSpreadsheetData(ROWS, COLS),
      height: HEIGHT,
      colWidths: 50,
      rowHeights: 23,
      columnSummary: [{
        destinationRow: summaryRow,
        destinationColumn: summaryCol,
        ranges: [[0, 10]],
        type: 'count',
      }],
    });

    await scrollViewportTo({ row: summaryRow, verticalSnap: 'top' });
    await render();

    // columnSummary applies the result styling declaratively (recording-off `setCellMeta`), so it is
    // retained on the cell meta and survives the cell being released from the viewport.
    expect(getCellMeta(summaryRow, summaryCol).className).toBe('columnSummaryResult');

    await scrollAwayAndBack(summaryRow);

    expect(getCellMeta(summaryRow, summaryCol).className).toBe('columnSummaryResult');
  });
});
