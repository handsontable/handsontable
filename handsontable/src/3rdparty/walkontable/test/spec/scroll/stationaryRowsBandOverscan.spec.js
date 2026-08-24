describe('Walkontable directional row band overscan on vertical scroll', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(300).height(400);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(200, 50);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  // Writes text content the way the core text-cell renderer does (`fastInnerText`): when a lone
  // text node is already in place, only its data is updated (a characterData mutation).
  function writeText(element, value) {
    if (element.childNodes.length === 1 && element.firstChild.nodeType === 3) {
      element.firstChild.data = `${value}`;
    } else {
      element.textContent = `${value}`;
    }
  }

  // The row overscan applies only under uniform row heights, so the specs opt in through
  // `rowHeightsUniform` (the default row height is genuinely uniform here).
  function makeWot(overrides = {}) {
    const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
      writeText(TD, `r${row}c${col}`);
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeightsUniform: () => true,
      cellRenderer,
      ...overrides,
    });

    return { wt, cellRenderer };
  }

  function renderedBand(wt) {
    return wt.wtViewport.rowsRenderCalculator;
  }

  function renderedRowCount() {
    return getTableMaster().find('tbody tr').length;
  }

  function rowHeight() {
    return getTableMaster().find('tbody tr:first').outerHeight();
  }

  // Real scrolls drive the draw through the scroll-sync path, which sets the scroll-direction
  // flags the stationary-band path relies on.
  function vScrollTo(wt, scrollTop) {
    wt.wtTable.holder.scrollTop = scrollTop;
    wt.wtOverlays.syncScrollPositions();
  }

  function hScrollTo(wt, scrollLeft) {
    wt.wtTable.holder.scrollLeft = scrollLeft;
    wt.wtOverlays.syncScrollPositions();
  }

  it('should extend the rendered band downward when scrolling down', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 3) + 7);

    const band = renderedBand(wt);

    expect(band.startRow).toBe(3);
    expect(band.rowStartOffset).toBe(0);
    // half the ~17-row viewport exceeds the cap, so the extension equals ROW_BAND_OVERSCAN_MAX
    expect(band.rowEndOffset).toBe(4);
  });

  it('should resolve the scroll steps inside the overscan as fast draws (no cell renders)', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 3) + 7); // full draw with downward overscan
    cellRenderer.calls.reset();

    vScrollTo(wt, (rowH * 4) + 7);
    vScrollTo(wt, (rowH * 5) + 7);
    vScrollTo(wt, (rowH * 6) + 7);

    expect(cellRenderer).not.toHaveBeenCalled();
  });

  it('should extend the rendered band upward when scrolling back up', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 60) + 7); // far down first
    vScrollTo(wt, (rowH * 59) + 7); // one row back - direction flips, full draw

    const band = renderedBand(wt);

    expect(band.startRow).toBeLessThan(59);
    // half the ~17-row viewport exceeds the cap, so the extension equals ROW_BAND_OVERSCAN_MAX
    expect(band.rowStartOffset).toBe(4);

    cellRenderer.calls.reset();

    vScrollTo(wt, (rowH * 58) + 7);
    vScrollTo(wt, (rowH * 57) + 7);

    expect(cellRenderer).not.toHaveBeenCalled();
  });

  it('should place the band at the same pixel position as a full render (upward overscan)', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 60) + 7);
    vScrollTo(wt, (rowH * 59) + 7); // upward overscan applied, startPosition recomputed

    // CONTENT-space position (relative to the hider = the scrolled content origin) of the TR that
    // displays source row 63 - a row fully inside the viewport, so it is rendered by BOTH the
    // overscanned band and the natural band (row 59 itself sits above the viewport after the upward
    // step and only the overscanned band renders it). Content space makes the comparison
    // scroll-independent - a full `draw(false)` may adjust the holder's scroll position, which
    // would skew a viewport-space (`rect.top`) comparison.
    const rowContentTop = () => {
      const band = renderedBand(wt);
      const tr = getTableMaster().find('tbody tr').get(63 - band.startRow);

      return tr.getBoundingClientRect().top - wt.wtTable.hider.getBoundingClientRect().top;
    };

    const overscannedTop = rowContentTop();

    // A full render at the same scroll position computes the band the legacy way (ground truth).
    wt.draw(false);

    expect(rowContentTop()).toBe(overscannedTop);
  });

  it('should not grow the band beyond one overscan on a scroll-direction flip', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 30) + 7); // down: band gains downward overscan
    const countAfterDown = renderedRowCount();

    vScrollTo(wt, (rowH * 27) + 7); // flip up: upward overscan replaces the downward one

    expect(renderedRowCount()).toBe(countAfterDown);
  });

  it('should apply no row overscan on a horizontal-only scroll (never-overscanned band stays without overscan)', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowCountBefore = renderedRowCount();

    // Horizontal band crossings recompute the row axis too (stationary bands, both axes). With no
    // vertical movement ever, the zero-delta path must not invent a overscan side.
    for (let step = 2; step < 6; step++) {
      hScrollTo(wt, (50 * step) + 7);
    }

    expect(renderedRowCount()).toBe(rowCountBefore);
    expect(renderedBand(wt).rowEndOffset).toBe(0);
    expect(renderedBand(wt).rowStartOffset).toBe(0);
  });

  it('should apply no row overscan on a horizontal-only scroll with the auto override at the top edge', async() => {
    // Mirrors Handsontable's 'auto' offset override (±1, clamped at the edges). At scrollTop 0 the
    // start clamp records asymmetric offsets (0/1) - which must NOT read as an existing downward
    // overscan when a horizontal scroll recomputes the row band with zero vertical delta.
    const { wt } = makeWot({
      viewportRowCalculatorOverride: (calc) => {
        calc.startRow = Math.max(calc.startRow - 1, 0);
        calc.endRow = Math.min(calc.endRow + 1, getTotalRows() - 1);
      },
    });

    wt.draw();

    const rowCountBefore = renderedRowCount();

    for (let step = 2; step < 6; step++) {
      hScrollTo(wt, (50 * step) + 7);
    }

    expect(renderedRowCount()).toBe(rowCountBefore);
    expect(renderedBand(wt).rowEndOffset).toBe(1);
  });

  it('should keep an existing overscan side across a horizontal-only scroll draw', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 10) + 7); // vertical scroll: band gains downward overscan

    const bandBefore = { ...renderedBand(wt) };

    // A horizontal band crossing recomputes the row band with a zero vertical delta - the overscanned
    // band must come out identical (same bounds, same offsets), not rotated or dropped.
    hScrollTo(wt, (50 * 3) + 7);

    const bandAfter = renderedBand(wt);

    expect(bandAfter.startRow).toBe(bandBefore.startRow);
    expect(bandAfter.endRow).toBe(bandBefore.endRow);
    expect(bandAfter.rowEndOffset).toBe(bandBefore.rowEndOffset);
  });

  it('should respect an explicit symmetric override wider than the auto offset (no overscan)', async() => {
    const { wt } = makeWot({
      viewportRowCalculatorOverride: (calc) => {
        calc.startRow = Math.max(calc.startRow - 3, 0);
        calc.endRow = Math.min(calc.endRow + 3, getTotalRows() - 1);
      },
    });

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 10) + 7);

    const band = renderedBand(wt);

    expect(band.rowStartOffset).toBe(3);
    expect(band.rowEndOffset).toBe(3);
  });

  it('should apply no overscan when the offset option is not in its auto mode', async() => {
    // Mirrors an explicit numeric `viewportRowRenderingOffset`: a number is an exact manual
    // offset, so the dynamic scroll-direction overscan stays off for the axis.
    const { wt } = makeWot({ viewportRowRenderingOffsetIsAuto: () => false });

    wt.draw();

    vScrollTo(wt, (rowHeight() * 4) + 7);

    expect(renderedBand(wt).rowEndOffset).toBe(0);
    expect(renderedBand(wt).rowStartOffset).toBe(0);
  });

  it('should apply no overscan when row heights are not uniform', async() => {
    const { wt } = makeWot({ rowHeightsUniform: () => false });

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 4) + 7);

    expect(renderedBand(wt).rowEndOffset).toBe(0);
    expect(renderedBand(wt).rowStartOffset).toBe(0);
  });

  it('should drop the overscan on a non-scroll full draw', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, (rowH * 4) + 7);

    const overscannedCount = renderedBand(wt).count;

    wt.draw(false); // a data/settings-driven render is not a scroll-driven draw

    expect(renderedBand(wt).count).toBeLessThan(overscannedCount);
    expect(renderedBand(wt).rowEndOffset).toBe(0);
  });

  it('should clamp the overscan at both dataset edges without errors', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    vScrollTo(wt, 100000); // far bottom edge

    expect(renderedBand(wt).endRow).toBe(getTotalRows() - 1);

    vScrollTo(wt, (rowH * 100) + 7); // re-establish a mid-table band
    vScrollTo(wt, 0); // far top edge

    expect(renderedBand(wt).startRow).toBe(0);
  });

  it('should perform no structural DOM mutations across band crossings on a steady scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowH = rowHeight();

    // Warm-up: establish the overscanned, sticky band size.
    vScrollTo(wt, (rowH * 2) + 7);
    vScrollTo(wt, (rowH * 4) + 7);

    const records = [];
    const observer = new MutationObserver((list) => {
      records.push(...list);
    });

    observer.observe(wt.wtTable.holder.parentNode, { subtree: true, childList: true });
    observer.takeRecords();

    // Enough one-row steps to include several full band re-renders (overscan exhaustions).
    for (let step = 5; step < 40; step += 2) {
      vScrollTo(wt, (rowH * step) + 7);
    }

    records.push(...observer.takeRecords());
    observer.disconnect();

    const structuralMutations = records.filter(record => record.type === 'childList');

    expect(structuralMutations.length).toBe(0);
  });
});
