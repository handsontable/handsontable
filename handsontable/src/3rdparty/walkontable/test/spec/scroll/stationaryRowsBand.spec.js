describe('Walkontable stationary rows band on vertical scroll', () => {
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

  // Writes text content the way the core text-cell renderer does (`fastInnerText`): when a lone
  // text node is already in place, only its data is updated (a characterData mutation). Replacing
  // the node (`innerHTML`/`textContent`) would be a structural childList mutation on every render.
  function writeText(element, value) {
    if (element.childNodes.length === 1 && element.firstChild.nodeType === 3) {
      element.firstChild.data = `${value}`;
    } else {
      element.textContent = `${value}`;
    }
  }

  function makeWot(overrides = {}) {
    const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
      writeText(TD, `r${row}c${col}`);
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        writeText(TH, row + 1);
      }],
      columnHeaders: [function(column, TH) {
        writeText(TH, column + 1);
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

  // A real vertical scroll drives the draw through the scroll-sync path, which sets the
  // verticalScrolling flag the stationary-band path relies on.
  function scrollTo(wt, scrollTop) {
    wt.wtTable.holder.scrollTop = scrollTop;
    wt.wtOverlays.syncScrollPositions();
  }

  it('should keep the same TR nodes in the same DOM order across a pure vertical scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    // Warm-up scrolls: reaching an unaligned offset lets the band grow to its steady (sticky) size.
    scrollTo(wt, (rowHeight * 3) + 7);
    scrollTo(wt, (rowHeight * 6) + 7);

    const tbody = getTableMaster().find('tbody').get(0);
    const trsBefore = Array.from(tbody.children);

    scrollTo(wt, (rowHeight * 9) + 7);

    const trsAfter = Array.from(tbody.children);

    // The band shifted by 3 rows, but the TR nodes are stationary: same references, same order.
    expect(trsAfter.length).toBe(trsBefore.length);
    trsAfter.forEach((tr, index) => {
      expect(tr).toBe(trsBefore[index]);
    });
  });

  it('should perform no structural DOM mutations on a steady-state pure vertical scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    // Warm-up: let the band reach its steady (sticky) size before observing.
    scrollTo(wt, (rowHeight * 2) + 7);
    scrollTo(wt, (rowHeight * 4) + 7);

    const observer = new MutationObserver(() => {});

    observer.observe(wt.wtTable.holder.parentNode, { subtree: true, childList: true });
    observer.takeRecords();

    // Several one-row band shifts at unaligned offsets - each one re-renders the band.
    for (let step = 5; step < 10; step++) {
      scrollTo(wt, (rowHeight * step) + 7);
    }

    const structuralMutations = observer.takeRecords().filter(record => record.type === 'childList');

    observer.disconnect();

    expect(structuralMutations.length).toBe(0);
  });

  it('should keep the rendered band size constant across mid-table scroll positions', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();
    const counts = new Set();

    // Mixed aligned and unaligned offsets - the natural band size differs between them; the sticky
    // band must not shrink back and forth (that add/remove of a TR is a structural mutation).
    scrollTo(wt, (rowHeight * 2) + 7); // unaligned (largest natural band)

    for (let step = 3; step < 12; step++) {
      scrollTo(wt, rowHeight * step); // aligned
      counts.add(renderedRowCount());
      scrollTo(wt, (rowHeight * step) + 7); // unaligned
      counts.add(renderedRowCount());
    }

    expect(counts.size).toBe(1);
  });

  it('should re-render the whole band in place on a pure vertical scroll', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();

    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    scrollTo(wt, (rowHeight * 2) + 7); // warm-up to the steady band size

    cellRenderer.calls.reset();

    scrollTo(wt, (rowHeight * 5) + 7);

    // Stationary band: the DOM nodes stay, so every rendered cell gets its content rewritten.
    expect(cellRenderer.calls.count()).toBe(renderedRowCount() * renderedColCount());
  });

  it('should produce the same body content as a full render after a scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const rows = renderedRowCount();
    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    scrollTo(wt, rowHeight * Math.floor(rows / 2));

    const afterScroll = firstColumnTexts();

    // A full render at the same scroll position re-renders every cell from scratch (ground truth).
    wt.draw(false);

    const afterFullRender = firstColumnTexts().slice(0, afterScroll.length);

    expect(afterScroll.slice(0, afterFullRender.length)).toEqual(afterFullRender);
  });

  it('should render the whole natural band on a full (non-scroll) draw even if the scroll-direction flags are still set', async() => {
    const { wt, cellRenderer } = makeWot();

    wt.draw();
    wt.draw(false); // settle to the steady-state full-render count

    cellRenderer.calls.reset();
    wt.draw(false); // baseline: a plain full render at this position

    const fullBandCalls = cellRenderer.calls.count();

    // Simulate the reentrancy window: an `afterScroll` hook can call `hot.render()` (a full,
    // `forceFullRender` `draw(false)`) while the scroll-direction flags are still set. A full render
    // enters as a non-fast draw, so the stationary-band (sticky size) path must NOT fire here.
    wt.wtOverlays.verticalScrolling = true;
    wt.wtOverlays.horizontalScrolling = false;

    cellRenderer.calls.reset();

    wt.draw(false); // full render (entered as a non-fast draw), flags still set

    expect(cellRenderer.calls.count()).toBe(fullBandCalls);
  });

  it('should keep rendering correct content when singlePassLayout is off (e.g. merged cells)', async() => {
    // `mergeCells` forces `singlePassLayout` off; the stationary-band size gate is off on that path,
    // so this only asserts the rendered content stays correct there.
    const { wt } = makeWot({ singlePassLayout: false });

    wt.draw();

    const rows = renderedRowCount();
    const rowHeight = getTableMaster().find('tbody tr:first').outerHeight();

    scrollTo(wt, rowHeight * Math.floor(rows / 2));

    const afterScroll = firstColumnTexts();

    wt.draw(false);

    const afterFullRender = firstColumnTexts().slice(0, afterScroll.length);

    expect(afterScroll.slice(0, afterFullRender.length)).toEqual(afterFullRender);
  });
});
