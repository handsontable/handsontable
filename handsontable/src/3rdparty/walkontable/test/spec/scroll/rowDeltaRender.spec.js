describe('Walkontable row delta render on vertical scroll', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(400);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function makeWot(overrides = {}) {
    const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
      TD.innerHTML = `r${row}c${col}`;
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) {
        TH.innerHTML = column + 1;
      }],
      cellRenderer,
      ...overrides,
    });

    return { wt, cellRenderer };
  }

  function renderedRowCount() {
    return getTableMaster().find('tbody tr').length;
  }

  function renderedColCount() {
    return getTableMaster().find('tbody tr:first td').length;
  }

  // First TD text of every rendered body row - the ground-truth of what the band shows.
  function firstColumnTexts() {
    return getTableMaster().find('tbody tr').map(function() {
      return $(this).find('td:first').text();
    }).get();
  }

  it('should re-render only the rows entering the band on a pure vertical scroll (not the whole band)', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    const rows = renderedRowCount();
    const cols = renderedColCount();
    const fullBandCalls = cellRenderer.calls.count();

    expect(fullBandCalls).toBe(rows * cols);

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();
    const shiftRows = Math.floor(rows / 2); // partial shift - fewer rows than the band holds

    cellRenderer.calls.reset();

    // A real vertical scroll drives the draw through the scroll-sync path, which sets the
    // verticalScrolling flag the delta-render path relies on.
    wt.wtTable.holder.scrollTop = rowHeight * shiftRows;
    wt.wtOverlays.syncScrollPositions();

    const deltaCalls = cellRenderer.calls.count();

    // The band moved (some rows entered), so the cell renderer ran ...
    expect(deltaCalls).toBeGreaterThan(0);
    // ... but for far fewer cells than a full band render (only the entering rows) ...
    expect(deltaCalls).toBeLessThan(fullBandCalls);
    // ... and it ran for whole rows only (columns are unchanged on a vertical scroll).
    expect(deltaCalls % cols).toBe(0);
  });

  it('should produce the same body content as a full render after a delta scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rows = renderedRowCount();
    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    wt.wtTable.holder.scrollTop = rowHeight * Math.floor(rows / 2);
    wt.wtOverlays.syncScrollPositions();

    const afterDelta = firstColumnTexts();

    // A full render at the same scroll position re-renders every cell from scratch (ground truth).
    wt.draw(false);

    const afterFullRender = firstColumnTexts();

    expect(afterDelta).toEqual(afterFullRender);
  });

  it('should render the whole band on a full (non-scroll) draw even if the scroll-direction flags are still set', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();
    wt.draw(false); // settle to the steady-state full-render count

    cellRenderer.calls.reset();
    wt.draw(false); // baseline: a plain full render at this position
    const fullBandCalls = cellRenderer.calls.count();

    // Simulate the reentrancy window: an `afterScroll` hook can call `hot.render()` (a full,
    // `forceFullRender` `draw(false)`) while the scroll-direction flags are still set. A full render
    // must always rebuild the whole band, so the delta path must NOT fire here.
    wt.wtOverlays.verticalScrolling = true;
    wt.wtOverlays.horizontalScrolling = false;

    cellRenderer.calls.reset();

    wt.draw(false); // full render (entered as a non-fast draw), flags still set

    expect(cellRenderer.calls.count()).toBe(fullBandCalls);
  });

  it('should render the whole band (no delta) when singlePassLayout is off (e.g. merged cells)', async() => {
    // `mergeCells` forces `singlePassLayout` off; merged cells recompute their spans per viewport, so
    // rotating surviving rows and skipping their re-render is unsafe. The delta path must not fire.
    const { wt, cellRenderer } = makeWot({ singlePassLayout: false });

    wt.draw();

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    cellRenderer.calls.reset();

    wt.wtTable.holder.scrollTop = rowHeight * Math.floor(renderedRowCount() / 2);
    wt.wtOverlays.syncScrollPositions();

    // Every row currently in the band was re-rendered - no survivor was skipped. Measured at the
    // post-scroll state so the expectation matches the band actually rendered on this draw.
    expect(cellRenderer.calls.count()).toBe(renderedRowCount() * renderedColCount());
  });
});
