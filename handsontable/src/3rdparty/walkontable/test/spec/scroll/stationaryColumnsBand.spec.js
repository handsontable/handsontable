describe('Walkontable stationary columns band on horizontal scroll', () => {
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

  function columnWidth(wt) {
    return $(wt.wtTable.TBODY).find('tr:first td:first').outerWidth();
  }

  function renderedColCount() {
    return getTableMaster().find('tbody tr:first td').length;
  }

  // First-row TD texts - the ground-truth of what the column band shows.
  function firstRowTexts() {
    return getTableMaster().find('tbody tr:first td').map(function() {
      return $(this).text();
    }).get();
  }

  // A real horizontal scroll drives the draw through the scroll-sync path, which sets the
  // horizontalScrolling flag the stationary-band path relies on.
  function scrollTo(wt, scrollLeft) {
    wt.wtTable.holder.scrollLeft = scrollLeft;
    wt.wtOverlays.syncScrollPositions();
  }

  it('should keep the same TD nodes in the same DOM order across a pure horizontal scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colW = columnWidth(wt);

    // Warm-up scrolls: reaching an unaligned offset lets the band grow to its steady (sticky) size.
    scrollTo(wt, (colW * 3) + 7);
    scrollTo(wt, (colW * 6) + 7);

    const firstTr = getTableMaster().find('tbody tr').get(0);
    const tdsBefore = Array.from(firstTr.children);

    scrollTo(wt, (colW * 9) + 7);

    const tdsAfter = Array.from(firstTr.children);

    // The band shifted by 3 columns, but the TD nodes are stationary: same references, same order.
    expect(tdsAfter.length).toBe(tdsBefore.length);
    tdsAfter.forEach((td, index) => {
      expect(td).toBe(tdsBefore[index]);
    });
  });

  it('should perform no structural DOM mutations on a steady-state pure horizontal scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colW = columnWidth(wt);

    // Warm-up: let the band reach its steady (sticky) size before observing.
    scrollTo(wt, (colW * 2) + 7);
    scrollTo(wt, (colW * 4) + 7);

    const observer = new MutationObserver(() => {});

    observer.observe(wt.wtTable.holder.parentNode, { subtree: true, childList: true });
    observer.takeRecords();

    // Several one-column band shifts at unaligned offsets - each one re-renders the band,
    // including the THEAD (the column window changes on every step).
    for (let step = 5; step < 10; step++) {
      scrollTo(wt, (colW * step) + 7);
    }

    const structuralMutations = observer.takeRecords().filter(record => record.type === 'childList');

    observer.disconnect();

    expect(structuralMutations.length).toBe(0);
  });

  it('should keep the rendered band size constant across mid-table scroll positions', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colW = columnWidth(wt);
    const counts = new Set();

    // Mixed aligned and unaligned offsets - the natural band size differs between them; the sticky
    // band must not shrink back and forth (that add/remove of TD/TH/COL nodes is structural).
    scrollTo(wt, (colW * 2) + 7); // unaligned (largest natural band)

    for (let step = 3; step < 12; step++) {
      scrollTo(wt, colW * step); // aligned
      counts.add(renderedColCount());
      scrollTo(wt, (colW * step) + 7); // unaligned
      counts.add(renderedColCount());
    }

    expect(counts.size).toBe(1);
  });

  it('should keep the rendered bands stable across alternating vertical and horizontal scrolls', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colW = columnWidth(wt);
    const rowH = getTableMaster().find('tbody tr:first').outerHeight();

    // Warm both axes to their steady band sizes.
    scrollTo(wt, (colW * 2) + 7);
    wt.wtTable.holder.scrollTop = (rowH * 2) + 7;
    wt.wtOverlays.syncScrollPositions();

    const observer = new MutationObserver(() => {});

    observer.observe(wt.wtTable.holder.parentNode, { subtree: true, childList: true });
    observer.takeRecords();

    // Alternate axes - a draw for one axis recomputes the other axis' band too, so any per-axis
    // stabilization gap would shrink-and-regrow the other band here (structural churn).
    for (let step = 3; step < 8; step++) {
      wt.wtTable.holder.scrollTop = (rowH * step) + 7;
      wt.wtOverlays.syncScrollPositions();
      scrollTo(wt, (colW * step) + 7);
    }

    const structuralMutations = observer.takeRecords().filter(record => record.type === 'childList');

    observer.disconnect();

    expect(structuralMutations.length).toBe(0);
  });

  it('should produce the same body content as a full render after a horizontal scroll', async() => {
    const { wt } = makeWot();

    wt.draw();

    const colW = columnWidth(wt);

    scrollTo(wt, colW * 5);

    const afterScroll = firstRowTexts();

    // A full render at the same scroll position re-renders every cell from scratch (ground truth).
    wt.draw(false);

    const afterFullRender = firstRowTexts().slice(0, afterScroll.length);

    expect(afterScroll.slice(0, afterFullRender.length)).toEqual(afterFullRender);
  });
});
