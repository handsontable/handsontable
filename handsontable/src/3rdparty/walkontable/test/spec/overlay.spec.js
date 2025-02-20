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

  it('should cloned overlays have to have proper dimensions (overflow hidden)', () => {
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

  it('should cloned overlays have to have proper dimensions (window object as scrollable element)', () => {
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

  it('should cloned overlays have to have proper dimensions after table scroll (overflow hidden)', () => {
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

  it('should cloned overlays have to have proper dimensions after table scroll (window object as scrollable element)', () => {
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

  it('should cloned overlays have to have proper positions (overflow hidden)', () => {
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

  it('should cloned overlays have to have proper positions (window object as scrollable element)', () => {
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

  it('should cloned overlays have to have proper positions after table scroll (overflow hidden)', () => {
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

  it('should cloned overlays have to have proper positions after table scroll (window object as scrollable element)', () => {
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

  it('should cloned header overlays have to have proper dimensions (overflow hidden)', () => {
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
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(200 - getScrollbarWidth());
  });

  it('should cloned header overlays have to have proper dimensions (window object as scrollable element)', () => {
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
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
  });

  it('should cloned header overlays have to have proper dimensions after table scroll (overflow hidden)', () => {
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

  it('should cloned header overlays have to have proper dimensions after table scroll (window object as scrollable element)', () => {
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
    // total columns * 50px (cell width) + 50px (row header) + 1px (header border left width)
    const totalColumnsWidth = (getTotalColumns() * 50) + 50 + 1;

    expect($(wt.wtTable.holder).width()).toBe(clientWidth);
    expect($(wt.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
  });

  it('should cloned header overlays have to have proper positions (overflow hidden)', () => {
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
      bottom: 31,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 31,
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions (window object as scrollable element)', () => {
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
      bottom: 23 + BODY_MARGIN, // 1 top row * 23px + body margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 23 + BODY_MARGIN, // 1 top row * 23px + body margin
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: totalRowsHight + BODY_MARGIN, // 8 default browser margin
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions after table scroll (overflow hidden)', () => {
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
      bottom: 23 + BODY_MARGIN + 1, // 1 top row * 23px + body margin + 1px (innerBorderTop)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: 23 + BODY_MARGIN + 1, // 1 top row * 23px + body margin + 1px (innerBorderTop)
      left: BODY_MARGIN,
    }));
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: BODY_MARGIN,
      bottom: CLIENT_HEIGHT + BODY_MARGIN,
      left: BODY_MARGIN,
    }));
  });

  it('should cloned header overlays have to have proper positions after table scroll (window object as scrollable element)', () => {
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
    // total columns * 23px + 23px (column header) + 1px (innerBorderTop)
    const totalRowsHeight = (getTotalRows() * 23) + 23 + 1;
    // total columns * 50px (cell width) + 50px (row header)
    const totalColumnsWidth = (getTotalColumns() * 50) + 50;
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight - 1, // 1px header border compensation
      bottom: documentClientHeight,
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
    expect(getTableRect(wt.wtOverlays.inlineStartOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight - 1, // 1px header border compensation
      bottom: documentClientHeight,
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

    it('should reset top overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', () => {
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
      window.scrollBy(0, 23);

      expect(wt.wtOverlays.topOverlay.getOverlayOffset()).toBe(184);

      // it causes the overlay to be reset to the initial position
      window.scrollBy(0, 1);
      wt.draw();

      expect(wt.wtOverlays.topOverlay.getOverlayOffset()).toBe(0);
    });

    it('should reset left overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', () => {
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
      window.scrollBy(50, 0);

      expect(wt.wtOverlays.inlineStartOverlay.getOverlayOffset()).toBe(400);

      // it causes the overlay to be reset to the initial position
      window.scrollBy(1, 1);

      expect(wt.wtOverlays.inlineStartOverlay.getOverlayOffset()).toBe(0);
    });

    it('should reset bottom overlay\'s offset after the table is scroll out of the browser viewport (window object as scrollable element)', () => {
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
      window.scrollBy(0, -230);

      expect(wt.wtOverlays.bottomOverlay.getOverlayOffset()).toBe(184);

      // it causes the overlay to be reset to the initial position
      window.scrollBy(0, -1);

      expect(wt.wtOverlays.bottomOverlay.getOverlayOffset()).toBe(0);
    });
  });

  it('should adjust the header overlays sizes after table scroll (window object as scrollable element)', () => {
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
    // total rows * 23px (cell height) + 24px (column header) + 1px (border top for the first header)
    const totalRowsHeight = (getTotalRows() * 23) + 24 + 1;

    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(24); // 23px + 1px (innerBorderTop)
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.inlineStartOverlay.clone.wtTable.holder).height()).toBe(totalRowsHeight);

    $expander.remove();
  });

  it('should cloned overlays have to have all borders when an empty dataset is passed', () => {
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

  it('should return the list of all overlays when calling the `getOverlays` method', () => {
    createDataArray(3, 3);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    const wtOverlaysRef = wt.wtOverlays;
    const overlays = wtOverlaysRef.getOverlays();
    const overlaysWithMaster = wtOverlaysRef.getOverlays(true);

    expect(overlays).toEqual([
      wtOverlaysRef.topOverlay,
      wtOverlaysRef.topInlineStartCornerOverlay,
      wtOverlaysRef.inlineStartOverlay,
      wtOverlaysRef.bottomOverlay,
      wtOverlaysRef.bottomInlineStartCornerOverlay
    ]);

    expect(overlaysWithMaster).toEqual([
      wtOverlaysRef.topOverlay,
      wtOverlaysRef.topInlineStartCornerOverlay,
      wtOverlaysRef.inlineStartOverlay,
      wtOverlaysRef.bottomOverlay,
      wtOverlaysRef.bottomInlineStartCornerOverlay,
      wtOverlaysRef.wtTable
    ]);
  });

  it('should attach the `wheel` event to each overlay even if they are disabled (#dev-512)', () => {
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
});
