describe('Walkontable directional column band overscan on horizontal scroll', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(300).height(300);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(10, 100);
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

  // The overscan applies only under uniform column widths, so the specs opt in through
  // `columnWidthsUniform` (the default column width, 50px, is genuinely uniform here).
  function makeWot(overrides = {}) {
    const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
      writeText(TD, `r${row}c${col}`);
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnWidthsUniform: () => true,
      cellRenderer,
      ...overrides,
    });

    return { wt, cellRenderer };
  }

  function renderedBand(wt) {
    return wt.wtViewport.columnsRenderCalculator;
  }

  function renderedColCount() {
    return getTableMaster().find('tbody tr:first td').length;
  }

  // A real horizontal scroll drives the draw through the scroll-sync path, which sets the
  // horizontalScrolling flag the stationary-band path relies on.
  function scrollTo(wt, scrollLeft) {
    wt.wtTable.holder.scrollLeft = scrollLeft;
    wt.wtOverlays.syncScrollPositions();
  }

  it('should extend the rendered band toward the inline end when scrolling toward the inline end', async() => {
    const { wt } = makeWot();

    wt.draw();

    // 300px viewport / 50px columns; an unaligned offset makes columns 2..8 the natural band (7).
    scrollTo(wt, (50 * 2) + 7);

    const band = renderedBand(wt);

    // Overscan = ceil(7 / 2) = 4 extra columns past the natural band end, recorded in the end offset.
    expect(band.startColumn).toBe(2);
    expect(band.endColumn).toBe(12);
    expect(band.columnEndOffset).toBe(4);
    expect(band.columnStartOffset).toBe(0);
  });

  it('should resolve the scroll steps inside the overscan as fast draws (no cell renders)', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 2) + 7); // full draw, band 2..12 (4 columns of overscan)
    cellRenderer.calls.reset();

    // One-column steps that stay inside the overscanned band - none may re-render a cell.
    scrollTo(wt, 157);
    scrollTo(wt, 207);
    scrollTo(wt, 257);
    scrollTo(wt, 307);

    expect(cellRenderer).not.toHaveBeenCalled();

    // The step that reaches the band edge re-renders (and re-applies fresh overscan).
    scrollTo(wt, 357);

    expect(cellRenderer).toHaveBeenCalled();
  });

  it('should extend the rendered band toward the inline start when scrolling back', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 20) + 7); // far to the right first
    scrollTo(wt, (50 * 19) + 7); // one column back - direction flips, full draw

    const band = renderedBand(wt);

    // Natural band 19..25 (7 columns); overscan = 4 applied at the start side.
    expect(band.startColumn).toBe(15);
    expect(band.columnStartOffset).toBe(4);

    cellRenderer.calls.reset();

    // Steps inside the start-side overscan are fast draws.
    scrollTo(wt, 907);
    scrollTo(wt, 857);
    scrollTo(wt, 807);

    expect(cellRenderer).not.toHaveBeenCalled();
  });

  it('should place the band at the same pixel position as a full render (start-side overscan)', async() => {
    const { wt } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 20) + 7);
    scrollTo(wt, (50 * 19) + 7); // start-side overscan applied, startPosition recomputed

    const findCell = text => getTableMaster().find('tbody tr:first td')
      .filter(function() {
        return $(this).text() === text;
      })
      .get(0);

    const overscannedLeft = findCell('r0c19').getBoundingClientRect().left;

    // A full render at the same scroll position computes the band the legacy way (ground truth).
    wt.draw(false);

    const naturalLeft = findCell('r0c19').getBoundingClientRect().left;

    expect(overscannedLeft).toBe(naturalLeft);
  });

  it('should not grow the band beyond one overscan on a scroll-direction flip', async() => {
    const { wt } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 10) + 7); // right: band gains end-side overscan
    const countAfterRight = renderedColCount();

    scrollTo(wt, (50 * 7) + 7); // flip to the left: start-side overscan replaces the end-side one

    // A double-pad (overscan applied after the size stabilizer) would grow the band by another
    // overscan here; the band size must stay exactly as it was.
    expect(renderedColCount()).toBe(countAfterRight);
    expect(renderedBand(wt).startColumn).toBe(3);
  });

  it('should respect an explicit symmetric override wider than the auto offset (no overscan)', async() => {
    const { wt } = makeWot({
      viewportColumnCalculatorOverride: (calc) => {
        calc.startColumn = Math.max(calc.startColumn - 3, 0);
        calc.endColumn = Math.min(calc.endColumn + 3, getTotalColumns() - 1);
      },
    });

    wt.draw();

    scrollTo(wt, (50 * 5) + 7);

    const band = renderedBand(wt);

    // The recorded override offsets (3/3) mark an explicit user choice - band kept exactly:
    // natural band 5..11 plus the symmetric 3, with no overscan on top.
    expect(band.columnStartOffset).toBe(3);
    expect(band.columnEndOffset).toBe(3);
    expect(band.startColumn).toBe(2);
    expect(band.endColumn).toBe(14);
  });

  it('should apply no column overscan on a vertical-only scroll (never-overscanned band stays without overscan)', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colCountBefore = renderedColCount();

    // Vertical band crossings recompute the column axis too (stationary bands, both axes). With
    // no horizontal movement ever, the zero-delta path must not invent a overscan side - otherwise
    // every vertical-only grid would permanently render the column overscan after its first scroll.
    const rowH = getTableMaster().find('tbody tr:first').outerHeight();

    for (let step = 2; step < 6; step++) {
      wt.wtTable.holder.scrollTop = (rowH * step) + 7;
      wt.wtOverlays.syncScrollPositions();
    }

    expect(renderedColCount()).toBe(colCountBefore);
    expect(renderedBand(wt).columnEndOffset).toBe(0);
    expect(renderedBand(wt).columnStartOffset).toBe(0);
  });

  it('should apply no column overscan on a vertical-only scroll with the auto override at the left edge', async() => {
    // Mirrors Handsontable's 'auto' offset override (±1, clamped at the edges). At scrollLeft 0 the
    // start clamp records asymmetric offsets (0/1) - which must NOT read as an existing end-side
    // overscan when a vertical scroll recomputes the column band with zero horizontal delta.
    const { wt } = makeWot({
      viewportColumnCalculatorOverride: (calc) => {
        calc.startColumn = Math.max(calc.startColumn - 1, 0);
        calc.endColumn = Math.min(calc.endColumn + 1, getTotalColumns() - 1);
      },
    });

    wt.draw();

    const colCountBefore = renderedColCount();
    const rowH = getTableMaster().find('tbody tr:first').outerHeight();

    for (let step = 2; step < 6; step++) {
      wt.wtTable.holder.scrollTop = (rowH * step) + 7;
      wt.wtOverlays.syncScrollPositions();
    }

    expect(renderedColCount()).toBe(colCountBefore);
    expect(renderedBand(wt).columnEndOffset).toBe(1);
  });

  it('should keep an existing overscan side across a vertical-only scroll draw', async() => {
    const { wt } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 4) + 7); // horizontal scroll: band gains end-side overscan

    const bandBefore = { ...renderedBand(wt) };
    const rowH = getTableMaster().find('tbody tr:first').outerHeight();

    // A vertical band crossing recomputes the column band with a zero horizontal delta - the
    // overscanned band must come out identical (same bounds, same offsets), not rotated or dropped.
    wt.wtTable.holder.scrollTop = (rowH * 3) + 7;
    wt.wtOverlays.syncScrollPositions();

    const bandAfter = renderedBand(wt);

    expect(bandAfter.startColumn).toBe(bandBefore.startColumn);
    expect(bandAfter.endColumn).toBe(bandBefore.endColumn);
    expect(bandAfter.columnEndOffset).toBe(bandBefore.columnEndOffset);
  });

  it('should apply no overscan when the offset option is not in its auto mode', async() => {
    // Mirrors an explicit numeric `viewportColumnRenderingOffset`: a number is an exact manual
    // offset, so the dynamic scroll-direction overscan stays off for the axis.
    const { wt } = makeWot({ viewportColumnRenderingOffsetIsAuto: () => false });

    wt.draw();

    scrollTo(wt, (50 * 4) + 7);

    expect(renderedBand(wt).columnEndOffset).toBe(0);
    expect(renderedBand(wt).columnStartOffset).toBe(0);
  });

  it('should apply no overscan when column widths are not uniform', async() => {
    const { wt } = makeWot({ columnWidthsUniform: () => false });

    wt.draw();

    scrollTo(wt, (50 * 4) + 7);

    expect(renderedBand(wt).columnEndOffset).toBe(0);
    expect(renderedBand(wt).columnStartOffset).toBe(0);
  });

  it('should drop the overscan on a non-scroll full draw', async() => {
    const { wt } = makeWot();

    wt.draw();

    scrollTo(wt, (50 * 4) + 7);

    const overscannedCount = renderedBand(wt).count;

    wt.draw(false); // a data/settings-driven render is not a scroll-driven draw

    expect(renderedBand(wt).count).toBeLessThan(overscannedCount);
    expect(renderedBand(wt).columnEndOffset).toBe(0);
  });

  it('should clamp the overscan at both dataset edges without errors', async() => {
    const { wt } = makeWot();

    wt.draw();

    scrollTo(wt, 100000); // far right edge

    expect(renderedBand(wt).endColumn).toBe(getTotalColumns() - 1);

    scrollTo(wt, (50 * 50) + 7); // re-establish a mid-table band
    scrollTo(wt, 0); // far left edge

    expect(renderedBand(wt).startColumn).toBe(0);
  });

  it('should perform no structural DOM mutations across band crossings on a steady scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    // Warm-up: establish the overscanned, sticky band size.
    scrollTo(wt, (50 * 2) + 7);
    scrollTo(wt, (50 * 4) + 7);

    const records = [];
    const observer = new MutationObserver((list) => {
      records.push(...list);
    });

    observer.observe(wt.wtTable.holder.parentNode, { subtree: true, childList: true });
    observer.takeRecords();

    // Enough one-column steps to include several full band re-renders (overscan exhaustions).
    for (let step = 5; step < 20; step++) {
      scrollTo(wt, (50 * step) + 7);
    }

    records.push(...observer.takeRecords());
    observer.disconnect();

    const structuralMutations = records.filter(record => record.type === 'childList');

    expect(structuralMutations.length).toBe(0);
  });
});

describe('Walkontable directional column band overscan on horizontal scroll (RTL mode)', () => {
  const debug = false;

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(300).height(300);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(10, 100);
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function makeWot() {
    const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
      TD.textContent = `r${row}c${col}`;
    });
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnWidthsUniform: () => true,
      cellRenderer,
    });

    return { wt, cellRenderer };
  }

  function scrollTo(wt, scrollLeft) {
    wt.wtTable.holder.scrollLeft = scrollLeft;
    wt.wtOverlays.syncScrollPositions();
  }

  it('should extend the band toward the inline end (higher logical indexes) in RTL', async() => {
    const { wt } = makeWot();

    wt.draw();

    // In RTL the browser reports leftward scrolling as a negative scrollLeft; the overscan logic
    // works on absolute offsets and logical indexes, so the overscan must land on the inline-end
    // side (the higher column indexes), exactly as in LTR.
    scrollTo(wt, -((50 * 2) + 7));

    const band = wt.wtViewport.columnsRenderCalculator;

    expect(band.startColumn).toBe(2);
    expect(band.columnEndOffset).toBe(4);
    expect(band.columnStartOffset).toBe(0);
  });

  it('should resolve RTL scroll steps inside the overscan as fast draws', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    scrollTo(wt, -((50 * 2) + 7));
    cellRenderer.calls.reset();

    scrollTo(wt, -157);
    scrollTo(wt, -207);
    scrollTo(wt, -257);

    expect(cellRenderer).not.toHaveBeenCalled();
  });
});
