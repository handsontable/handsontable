describe('WalkontableOverlay', () => {
  const BODY_MARGIN = parseInt(getComputedStyle(document.body).margin, 10);
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;
  const CLIENT_WIDTH = OUTER_WIDTH - getScrollbarWidth();
  const CLIENT_HEIGHT = OUTER_HEIGHT - getScrollbarWidth();

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('should cloned overlays have to have proper dimensions (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(OUTER_WIDTH);
    expect($(wt.wtTable.holder).height()).toBe(OUTER_HEIGHT);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(CLIENT_HEIGHT);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('should share a single geometry reader between the master and every overlay clone', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    const masterReader = wt.domBindings.geometryReader;

    expect(masterReader).toBeTruthy();
    expect(wt.wtOverlays.topOverlay.clone.domBindings.geometryReader).toBe(masterReader);
    expect(wt.wtOverlays.bottomOverlay.clone.domBindings.geometryReader).toBe(masterReader);
    expect(wt.wtOverlays.inlineStartOverlay.clone.domBindings.geometryReader).toBe(masterReader);
    expect(wt.wtOverlays.topInlineStartCornerOverlay.clone.domBindings.geometryReader).toBe(masterReader);
    expect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.domBindings.geometryReader).toBe(masterReader);
  });

  it('should cloned overlays have to have proper dimensions (overflow clip)', async() => {
    spec().$wrapper.css({ overflow: 'clip' });

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(OUTER_WIDTH);
    expect($(wt.wtTable.holder).height()).toBe(OUTER_HEIGHT);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(CLIENT_HEIGHT);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('should cloned overlays have to have proper dimensions (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    const clientWidth = document.body.clientWidth;
    const clientHeight = document.body.clientHeight;
    const totalColumnsWidth = getTotalColumns() * 50; // total columns * 50px (cell width)

    expect($(wt.wtTable.holder).width()).toBe(clientWidth);
    expect($(wt.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  describe('with the horizontal axis clipped by the root and the vertical axis scrolled by the window', () => {
    const ROOT_WIDTH = 300;

    beforeEach(() => {
      spec().$wrapper
        .css('overflow', '')
        .css('overflow-x', 'clip')
        .css('width', `${ROOT_WIDTH}px`)
        .css('height', '');
    });

    afterEach(() => {
      window.scrollTo(0, 0);
    });

    it('should cloned overlays have to have proper dimensions', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      const hiderHeight = $(wt.wtTable.hider).height();

      expect($(wt.wtTable.holder).width()).toBe(ROOT_WIDTH);
      // The holder is at content height plus its own horizontal scrollbar, which is the whole
      // point of this layout: the columns past the root's width scroll inside the holder.
      expect($(wt.wtTable.holder).height()).toBe(hiderHeight + getScrollbarWidth());
      expect(wt.wtTable.holder.scrollWidth).toBeGreaterThan(wt.wtTable.holder.clientWidth);
      // The top clone spans the root's full width: the vertical scrollbar belongs to the page, not
      // to the holder, so nothing is subtracted for it.
      expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(ROOT_WIDTH);
      expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
      expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
      expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
      expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
      // The frozen columns run the full content height, the way they do in window mode, and stop
      // where the rows stop - above the holder's horizontal scrollbar, which they must not cover.
      expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(hiderHeight);
      expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
      expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
      expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(ROOT_WIDTH);
      expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
    });

    it('should scroll the columns with the holder and the rows with the window', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
      });

      wt.draw();

      expect(wt.wtOverlays.inlineStartOverlay.mainTableScrollableElement).toBe(wt.wtTable.holder);
      expect(wt.wtOverlays.topOverlay.mainTableScrollableElement).toBe(window);
      expect(wt.wtOverlays.scrollableElement).toBe(wt.wtTable.holder);
    });

    it('should keep the frozen columns pinned to the root edge while the holder scrolls', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
      });

      wt.draw();
      wt.wtTable.holder.scrollLeft = 400;
      wt.draw();

      const rootRect = spec().$wrapper[0].getBoundingClientRect();
      const inlineStartRoot = wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder.parentNode;
      const cornerRoot = wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder.parentNode;
      const inlineStartRect = inlineStartRoot.getBoundingClientRect();
      const cornerRect = cornerRoot.getBoundingClientRect();

      expect(wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(400);
      expect(inlineStartRect.left).toBe(rootRect.left);
      expect(cornerRect.left).toBe(rootRect.left);
    });

    it('should keep the frozen rows pinned to the viewport top while the window scrolls', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
      });

      wt.draw();
      window.scrollTo(0, 300);
      wt.draw();

      const topRoot = wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode;
      const cornerRoot = wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder.parentNode;
      const topRect = topRoot.getBoundingClientRect();
      const cornerRect = cornerRoot.getBoundingClientRect();

      expect(wt.wtOverlays.topOverlay.getScrollPosition()).toBe(300);
      expect(Math.round(topRect.top)).toBe(0);
      expect(Math.round(cornerRect.top)).toBe(0);
    });
  });

  it('should cloned overlays have to have proper dimensions after table scroll (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 3); // -1 - 2 (fixedRowsBottom)
    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(OUTER_WIDTH);
    expect($(wt.wtTable.holder).height()).toBe(OUTER_HEIGHT);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(CLIENT_HEIGHT);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(CLIENT_WIDTH);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('should cloned overlays have to have proper dimensions after table scroll (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 3); // -1 - 2 (fixedRowsBottom)
    wt.draw();

    const clientWidth = document.body.clientWidth;
    const clientHeight = document.body.clientHeight;
    const totalColumnsWidth = getTotalColumns() * 50; // total columns * 50px (cell width)

    expect($(wt.wtTable.holder).width()).toBe(clientWidth);
    expect($(wt.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('should cloned overlays have to have proper positions (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    const getTableRect = (wtTable) => {
      const {
        top,
        bottom,
        left,
      } = wtTable.holder.getBoundingClientRect();

      return {
        top,
        bottom,
        left,
      };
    };

    const baseRect = getTableRect(wt.wtTable);

    const expectedFixedTopBottomHeight = 47; // 24px + 23px

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: OUTER_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: CLIENT_HEIGHT + BODY_MARGIN - expectedFixedTopBottomHeight,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: CLIENT_HEIGHT + BODY_MARGIN - expectedFixedTopBottomHeight,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned overlays have to have proper positions (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const expectedFixedTopBottomHeight = 47; // 24px + 23px
    const documentClientHeight = document.documentElement.clientHeight;
    const totalRowsHight = (getTotalRows() * 23) + 1; // total columns * 23px + 1px cell top border
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: totalRowsHight + BODY_MARGIN, // 8 default browser margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN, // 2 fixed top rows * 23px + body margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN, // 2 fixed top rows * 23px + body margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: totalRowsHight + BODY_MARGIN, // 8 default browser margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - expectedFixedTopBottomHeight, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - expectedFixedTopBottomHeight, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned overlays have to have proper positions after table scroll (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 3); // -1 - 2 (fixedRowsBottom)
    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const expectedFixedTopBottomHeight = 47; // 24px + 23px
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: OUTER_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: expectedFixedTopBottomHeight + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: CLIENT_HEIGHT - expectedFixedTopBottomHeight + BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: CLIENT_HEIGHT - expectedFixedTopBottomHeight + BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned overlays have to have proper positions after table scroll (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 3); // -1 - 2 (fixedRowsBottom)
    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const documentClientHeight = document.documentElement.clientHeight;
    const documentClientWidth = document.documentElement.clientWidth;
    const totalRowsHeight = (getTotalRows() * 23) + 1; // total columns * 23px + 1px cell top border
    const totalColumnsWidth = getTotalColumns() * 50; // total columns * 50px (cell width)
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight,
      bottom: documentClientHeight,
      left: documentClientWidth - totalColumnsWidth,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 0,
      bottom: 47,
      left: documentClientWidth - totalColumnsWidth,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 0,
      bottom: 47,
      left: 0,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight,
      bottom: documentClientHeight,
      left: 0,
    }));
    expect(getTableRect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - 47, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: 0,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - 47, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: documentClientWidth - totalColumnsWidth,
    }));
  });

  it('should cloned header overlays have to have proper dimensions (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(200);
    expect($(wt.wtTable.holder).height()).toBe(200);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(200 - getScrollbarWidth()); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px column-header border-bottom, at every scroll position (DEV-2786)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px column-header border-bottom, at every scroll position (DEV-2786)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(200 - getScrollbarWidth());
  });

  it('should cloned header overlays have to have proper dimensions (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    const clientWidth = document.body.clientWidth;
    const clientHeight = document.body.clientHeight;
    const totalColumnsWidth = (getTotalColumns() * 50) + 50; // total columns * 50px (cell width) + 50 (row header)

    expect($(wt.wtTable.holder).width()).toBe(clientWidth);
    expect($(wt.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px column-header border-bottom, at every scroll position (DEV-2786)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px column-header border-bottom, at every scroll position (DEV-2786)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
  });

  it('should cloned header overlays have to have proper dimensions after table scroll (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(200);
    expect($(wt.wtTable.holder).height()).toBe(200);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(200 - getScrollbarWidth()); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(200 - getScrollbarWidth());
  });

  it('should keep the column header height and run no nested re-draw when crossing the top edge (DEV-2786)', async() => {
    // Deliberately NOT on the single-pass gated path: no `singlePassLayout`, so the header-border
    // classes are resolved AFTER the cells render. That is the path that used to pay a nested
    // `wot.draw(true)` over the master and every clone on every crossing of vertical offset 0, to
    // settle the 1px the class shifted. The column header carries its `border-bottom` at every
    // scroll position now, so there is no shift, no `positionChanged` and no re-draw. This spec is
    // the reason the `refreshAll` expectations below are not vacuous - on the single-pass path they
    // would already have been green before the change.
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(column, TH) { // makes top overlay + drives the innerBorderTop toggle
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(false);

    const masterParent = wt.wtTable.holder.parentNode;
    const headerHeight = () => $(wt.wtOverlays.topOverlay.clone.wtTable.holder).height();

    expect(masterParent.classList.contains('innerBorderTop')).toBe(false);
    expect(headerHeight()).toBe(24); // 23px + 1px border-bottom

    const refreshAllSpy = spyOn(wt.wtOverlays, 'refreshAll').and.callThrough();

    // Cross the top edge (0 -> N).
    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw();

    // The class is still stamped, for backward compatibility - it just moves nothing.
    expect(masterParent.classList.contains('innerBorderTop')).toBe(true);
    expect(refreshAllSpy).not.toHaveBeenCalled();
    expect(headerHeight()).toBe(24);

    // Cross back to the top (N -> 0).
    wt.scrollViewportVertically(0);
    refreshAllSpy.calls.reset();
    wt.draw();

    expect(masterParent.classList.contains('innerBorderTop')).toBe(false);
    expect(refreshAllSpy).not.toHaveBeenCalled();
    expect(headerHeight()).toBe(24);
  });

  it('should cloned header overlays have to have proper dimensions after table scroll (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw();

    const clientWidth = document.body.clientWidth;
    const clientHeight = document.body.clientHeight;
    // total columns * 50px (cell width) + 50px (row header). The row header no longer grows by
    // 1px once the table is scrolled - it owns its inline-end border at every offset (#6673).
    const totalColumnsWidth = (getTotalColumns() * 50) + 50;

    expect($(wt.wtTable.holder).width()).toBe(clientWidth);
    expect($(wt.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
  });

  it('should cloned header overlays have to have proper positions (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: OUTER_WIDTH + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 32, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 32, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    // total columns * 23px + 23px (top header) + 1px (cell top border)
    const totalRowsHight = (getTotalRows() * 23) + 23 + 1;
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: totalRowsHight + BODY_MARGIN, // 8 default browser margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 24 + BODY_MARGIN, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 24 + BODY_MARGIN, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: totalRowsHight + BODY_MARGIN, // 8 default browser margin
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions after table scroll (overflow hidden)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: OUTER_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 24 + BODY_MARGIN, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 24 + BODY_MARGIN, // 23px header + 1px its own border-bottom, at every scroll position (DEV-2786)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions after table scroll (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw();

    const getTableRect = (wtTable) => {
      const rect = wtTable.holder.getBoundingClientRect();

      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
      };
    };

    const documentClientHeight = document.documentElement.clientHeight;
    const documentClientWidth = document.documentElement.clientWidth;
    // total columns * 23px + 24px (column header + its border-bottom)
    const totalRowsHeight = (getTotalRows() * 23) + 24;
    // total columns * 50px (cell width) + 50px (row header)
    const totalColumnsWidth = (getTotalColumns() * 50) + 50;
    const baseRect = getTableRect(wt.wtTable);

    // The table stands one pixel ABOVE the viewport's bottom edge, and it did before DEV-2786 too:
    // `TopOverlay#scrollTo`'s `newY += 1` overshoots the flush position by a pixel so the target row
    // is fully revealed rather than clipped by its own bottom border. That term is row-border
    // accounting, not header-border accounting - it is needed on a grid with no headers at all (the
    // "sticks to the bottom edge (without headers)" specs in `scroll/scroll.spec.js` land a row short
    // without it) - so DEV-2786 left it alone.
    //
    // What DID move is `bottom`, by exactly the pixel this change is about: `top` is unchanged and
    // the table is now one pixel SHORTER, because its first body row no longer draws a `border-top`.
    // `totalRowsHeight` above already accounts for that - the header's own `border-bottom` replaced
    // the row's, so the formula's total is the same number as before - which is why only this edge
    // moves.
    expect(baseRect).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight - 1,
      bottom: documentClientHeight - 1,
      left: documentClientWidth - totalColumnsWidth,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 0,
      bottom: 24,
      left: documentClientWidth - totalColumnsWidth,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 0,
      bottom: 24,
      left: 0,
    }));
    // The frozen-column clone mirrors the master's band, so both edges move with it.
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight - 1,
      bottom: documentClientHeight - 1,
      left: 0,
    }));
  });

  describe('overlay offset', () => {
    beforeEach(function() {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(10, 10);

      this.$wrapper.after($('<div class="space-filler" style="width: 4000px; height: 4000px">&nbsp;</div>'));
      this.$wrapper.before($('<div class="space-filler" style="width: 4000px; height: 4000px">&nbsp;</div>'));
    });

    afterEach(() => {
      jQuery('.space-filler').remove();
    });

    it('should reset top overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
      });

      wt.draw();
      wt.scrollViewport({ row: getTotalRows() - 1, col: 0 }, 'start', 'top');
      wt.draw();

      // scroll the viewport precisely 1px before the top overlay disappears
      await scrollWindowBy(0, 23);

      expect(wt.wtOverlays.topOverlay.getOverlayOffset()).toBe(184);

      // it causes the overlay to be reset to the initial position
      await scrollWindowBy(0, 1);
      wt.draw();

      expect(wt.wtOverlays.topOverlay.getOverlayOffset()).toBe(0);
    });

    it('should reset left overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedColumnsStart: 2,
      });

      wt.draw();
      wt.scrollViewport({ row: 0, col: getTotalColumns() - 1 }, 'start', 'top');
      wt.draw();

      // scroll the viewport precisely 1px before the left overlay disappears
      await scrollWindowBy(50, 0);

      expect(wt.wtOverlays.inlineStartOverlay.getOverlayOffset()).toBe(400);

      // it causes the overlay to be reset to the initial position
      await scrollWindowBy(1, 1);

      expect(wt.wtOverlays.inlineStartOverlay.getOverlayOffset()).toBe(0);
    });

    it('should reset bottom overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsBottom: 2,
      });

      wt.draw();
      wt.scrollViewport({ row: getTotalRows() - 1, col: 0 }, 'end', 'bottom');
      wt.draw();

      // scroll the viewport precisely 1px before the bottom overlay disappears
      await scrollWindowBy(0, -230);

      expect(wt.wtOverlays.bottomOverlay.getOverlayOffset()).toBe(184);

      // it causes the overlay to be reset to the initial position
      await scrollWindowBy(0, -1);

      expect(wt.wtOverlays.bottomOverlay.getOverlayOffset()).toBe(0);
    });
  });

  it('should adjust the header overlays sizes after table scroll (window object as scrollable element)', async() => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const $expander = $('<div></div>').css({ paddingBottom: '20000px' });

    spec().$wrapper.after($expander);

    createDataArray(5, 5);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();
    window.scrollTo(0, 20);
    wt.draw();

    // total columns * 50px (cell width) + 50px (row header)
    const totalColumnsWidth = (getTotalColumns() * 50) + 50;
    // total rows * 23px (cell height) + 24px (column header + its own border-bottom, DEV-2786)
    const totalRowsHeight = (getTotalRows() * 23) + 24;

    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(totalRowsHeight);

    $expander.remove();
  });

  it('should cloned overlays have to have all borders when an empty dataset is passed', async() => {
    createDataArray(0, 0);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) { // makes top overlay
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(column, TH) { // makes left overlay
        TH.innerHTML = column + 1;
      }],
    });

    wt.draw();

    expect(getTableTopClone().find('thead tr th').css('border-bottom-width')).toBe('1px');
  });

  it('should return the list of all overlays when calling the `getOverlays` method', async() => {
    createDataArray(3, 3);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    const wtOverlaysRef = wt.wtOverlays;
    const overlays = wtOverlaysRef.getOverlays();
    const overlaysWithMaster = wtOverlaysRef.getOverlays(true);

    // Construction order (the corners come last because they are built from the region overlays).
    // The list used to be asserted in the pre-#12951 order, and the failure went unreported: a failed
    // `toEqual` on overlay objects could not cross the reporter bridge, so the spec was dropped.
    expect(overlays).toEqual([
      wtOverlaysRef.topOverlay,
      wtOverlaysRef.bottomOverlay,
      wtOverlaysRef.inlineStartOverlay,
      wtOverlaysRef.topInlineStartCornerOverlay,
      wtOverlaysRef.bottomInlineStartCornerOverlay
    ]);

    expect(overlaysWithMaster).toEqual([
      wtOverlaysRef.topOverlay,
      wtOverlaysRef.bottomOverlay,
      wtOverlaysRef.inlineStartOverlay,
      wtOverlaysRef.topInlineStartCornerOverlay,
      wtOverlaysRef.bottomInlineStartCornerOverlay,
      wtOverlaysRef.wtTable
    ]);
  });

  it('should attach the `wheel` event to each overlay even if they are disabled (#dev-512)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 0,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
    });

    wt.draw();

    inlineStartOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(50);
    expect(topOverlay().getScrollPosition()).toBe(60);

    topInlineStartCornerOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(100);
    expect(topOverlay().getScrollPosition()).toBe(120);

    topOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(150);
    expect(topOverlay().getScrollPosition()).toBe(180);

    bottomInlineStartCornerOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(200);
    expect(topOverlay().getScrollPosition()).toBe(240);

    bottomOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(250);
    expect(topOverlay().getScrollPosition()).toBe(300);
  });

  it('should not scroll the table when the ctrl key is pressed on Windows OS (#dev-2405)', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 0,
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
    });

    wt.draw();

    inlineStartOverlay().clone.wtTable.holder
      .dispatchEvent(new WheelEvent('wheel', {
        deltaX: 50,
        deltaY: 60,
        ctrlKey: true,
      }));

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(topOverlay().getScrollPosition()).toBe(0);
  });
});
