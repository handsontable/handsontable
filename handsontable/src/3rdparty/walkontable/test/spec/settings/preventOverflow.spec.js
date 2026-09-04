describe('preventOverflow option', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$wrapper.width(500).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should set overflow to `hidden` for master table when `horizontal` value is not passed', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$table.parents('.wtHolder').css('overflow')).toBe('visible');
    expect(spec().$table.parents('.ht_master').css('overflow')).toBe('visible');
  });

  it('should set overflow to `hidden` for master table when `horizontal` value is passed', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      preventOverflow() {
        return 'horizontal';
      }
    });

    wt.draw();

    expect(spec().$table.parents('.wtHolder').css('overflow')).toBe('auto');
    expect(spec().$table.parents('.ht_master').css('overflow')).toBe('hidden');
  });

  it('should set overflow-x to `hidden` for top clone when `horizontal` value is passed', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(column, TH) {
        TH.innerHTML = column + 1;
      }],
      preventOverflow() {
        return 'horizontal';
      }
    });

    wt.draw();

    expect($(wt.wtTable.wtRootElement.parentNode).find('.ht_clone_top .wtHolder').css('overflow-x')).toBe('hidden');
    expect($(wt.wtTable.wtRootElement.parentNode).find('.ht_clone_top .wtHolder').css('overflow-y')).toBe('hidden');
  });

  it('should own the horizontal axis and leave the vertical one to the window when `horizontal` is passed', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      preventOverflow() {
        return 'horizontal';
      }
    });

    wt.draw();

    // The option is an alias of a per-axis owner: the wrapper owns the horizontal axis, the window
    // the vertical one. The old single-answer resolution reported the window on both.
    expect(wt.wtViewport.isHorizontallyScrollableByWindow()).toBe(false);
    expect(wt.wtViewport.isVerticallyScrollableByWindow()).toBe(true);
    expect(wt.wtViewport.getWorkspaceWidth()).toBe(500);
  });

  it('should scroll the frozen bottom rows with the window when `horizontal` is passed', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedRowsBottom: 2,
      preventOverflow() {
        return 'horizontal';
      }
    });

    wt.draw();

    // The bottom overlay is pinned against the vertical axis, the same as the top one. It used to
    // be left on the holder, which does not scroll vertically in this layout.
    expect(wt.wtOverlays.topOverlay.mainTableScrollableElement).toBe(window);
    expect(wt.wtOverlays.bottomOverlay.mainTableScrollableElement).toBe(window);
    expect(wt.wtOverlays.inlineStartOverlay.mainTableScrollableElement).toBe(wt.wtTable.holder);
  });

  it('should fire the vertical scroll callback on a window scroll when `horizontal` is passed', async() => {
    const scrollHorizontally = jasmine.createSpy('scrollHorizontally');
    let resolveVerticalScroll;
    const verticalScrolled = new Promise((resolve) => {
      resolveVerticalScroll = resolve;
    });
    const scrollVertically = jasmine.createSpy('scrollVertically').and.callFake(() => {
      resolveVerticalScroll();
    });
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      onScrollVertically: scrollVertically,
      onScrollHorizontally: scrollHorizontally,
      preventOverflow() {
        return 'horizontal';
      }
    });

    wt.draw();
    window.scrollTo(0, 200);

    // The vertical position used to be read off the holder (the single scrolling element), which
    // never moves on a page scroll, so this callback never fired in this layout.
    await verticalScrolled;

    expect(scrollVertically.calls.count()).toBe(1);
    expect(scrollHorizontally.calls.count()).toBe(0);
    expect(wt.wtOverlays.topOverlay.getScrollPosition()).toBe(200);

    window.scrollTo(0, 0);
  });
});
