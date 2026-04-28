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
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(23);
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
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(23);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).width()).toBe(50);
    expect($(wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.holder).height()).toBe(23);
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

  describe('hider bottom anchoring', () => {
    const buildScrolledToBottomGrid = () => {
      createDataArray(50, 10);
      spec().$wrapper.width(300).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
        ],
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
        ],
      });

      wt.draw();
      wt.scrollViewportVertically(getTotalRows() - 1);
      wt.draw();

      return wt;
    };

    it('should keep the master spreader flush with the hider bottom when scrolled to the last row', async() => {
      const wt = buildScrolledToBottomGrid();
      const { spreader, hider } = wt.wtTable;
      const calc = wt.wtViewport.rowsRenderCalculator;

      expect(calc.endRow).toBe(getTotalRows() - 1);
      // The rendered table is shorter than `sumCellSizes` predicts (border-collapse + browser
      // fractional-zoom rounding), so without the bottom-anchor adjustment the spreader bottom
      // would fall short of the hider bottom and leave a visible gap below the last row. The
      // 1px tolerance absorbs sub-pixel mismatches from headless Chrome rendering.
      const spreaderBottom = spreader.offsetTop + spreader.offsetHeight;

      expect(spreaderBottom).toBeGreaterThanOrEqual(hider.offsetHeight - 1);
      expect(spreaderBottom).toBeLessThanOrEqual(hider.offsetHeight + 1);
    });

    it('should keep the inlineStart-clone spreader aligned with the master spreader when scrolled to the last row', async() => {
      const wt = buildScrolledToBottomGrid();
      const masterSpreader = wt.wtTable.spreader;
      const inlineStartCloneSpreader = wt.wtOverlays.inlineStartOverlay.clone.wtTable.spreader;

      // The row-headers column (inlineStart clone) must follow the same bottom anchoring as the
      // master spreader, otherwise headers would visually drift away from their data rows.
      expect(parseInt(inlineStartCloneSpreader.style.top, 10))
        .toBe(parseInt(masterSpreader.style.top, 10));
    });

    it('should not anchor when the holder is taller than the data (no vertical scroll)', async() => {
      // 5 rows in a 300px holder fits without scrolling. `endRow === totalRows - 1` is still
      // true, but anchoring would create an empty band above the data instead of closing one
      // below it. The spreader must stay at `calc.startPosition` (= 0).
      createDataArray(5, 5);
      spec().$wrapper.width(300).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const calc = wt.wtViewport.rowsRenderCalculator;
      const { spreader } = wt.wtTable;

      expect(calc.endRow).toBe(getTotalRows() - 1);
      expect(wt.wtViewport.hasVerticalScroll()).toBe(false);
      expect(parseInt(spreader.style.top, 10)).toBe(calc.startPosition);
    });

    it('should not anchor when the rendered range does not include the last row', async() => {
      // After drawing without scrolling, the rendered range starts at row 0 and does not reach
      // the end of a long dataset. The anchor adjustment must be a no-op so the spreader stays
      // at `calc.startPosition`.
      createDataArray(200, 10);
      spec().$wrapper.width(300).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      const calc = wt.wtViewport.rowsRenderCalculator;
      const { spreader } = wt.wtTable;

      expect(calc.endRow).toBeLessThan(getTotalRows() - 1);
      expect(parseInt(spreader.style.top, 10)).toBe(calc.startPosition);
    });

    it('should not anchor while sticky-scroll is active', async() => {
      // The StickyScrollStrategy sets `position: sticky` with its own offset during native
      // scrollbar drag. The anchor adjustment would overwrite the sticky offset and break the
      // sticky behavior, so it must skip when the strategy reports active.
      const wt = buildScrolledToBottomGrid();
      const { spreader } = wt.wtTable;
      const calc = wt.wtViewport.rowsRenderCalculator;

      spyOn(wt.wtOverlays.getStickyScrollStrategy(), 'isActive').and.returnValue(true);

      wt.wtOverlays.applyToDOM();

      // The per-overlay `applyToDOM` calls write `calc.startPosition` to `spreader.style.top`.
      // If the anchor adjustment ran, it would overwrite that with `hider.height - spreader.height`
      // (a strictly larger value). Verifying the style.top stayed at `calc.startPosition`
      // proves the sticky guard short-circuited the adjustment.
      expect(parseInt(spreader.style.top, 10)).toBe(calc.startPosition);
    });

    describe('with fixedRowsBottom', () => {
      const buildScrolledToBottomGridWithFixedBottom = (fixedRowsBottom = 2) => {
        createDataArray(50, 10);
        spec().$wrapper.width(300).height(300);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedRowsBottom,
          rowHeaders: [
            (row, TH) => { TH.innerHTML = row; },
          ],
          columnHeaders: [
            (col, TH) => { TH.innerHTML = col; },
          ],
        });

        wt.draw();
        wt.scrollViewportVertically(getTotalRows() - 1);
        wt.draw();

        return wt;
      };

      it('should hide master rows that the bottom overlay also renders when scrolled to the bottom', async() => {
        // Without this guard, the master TBODY contains TRs for the same rows the bottom
        // overlay renders (its `endRow` reaches `totalRows - 1`). Border-collapse drift then
        // exposes 1-2px of those master rows above the overlay at fractional zoom levels,
        // producing a visible duplicate of the first fixed-bottom row (#11972). Hiding the
        // duplicates removes the overlap entirely.
        const wt = buildScrolledToBottomGridWithFixedBottom(2);
        const totalRows = getTotalRows();
        const masterTRs = Array.from(wt.wtTable.TBODY.children);
        const calc = wt.wtViewport.rowsRenderCalculator;
        const firstRenderedRow = calc.startRow;
        const hideFromRow = totalRows - 2;

        // Every TR whose absolute row index is in the bottom-overlay range must be hidden;
        // every TR before that range must remain visible.
        masterTRs.forEach((tr, i) => {
          const rowIndex = firstRenderedRow + i;

          if (rowIndex >= hideFromRow) {
            expect(tr.style.display).toBe('none');
          } else {
            expect(tr.style.display).not.toBe('none');
          }
        });
      });

      it('should restore display when the user scrolls back up', async() => {
        // The hide is gated on `#isScrolledToBottom`; once the user scrolls away from the
        // bottom, the duplicate-rows condition no longer holds and the previously-hidden TRs
        // must become visible again. Otherwise a fast scroll up would leave a permanent gap
        // at the bottom of the master.
        const wt = buildScrolledToBottomGridWithFixedBottom(2);

        wt.scrollViewportVertically(0);
        wt.draw();

        const masterTRs = Array.from(wt.wtTable.TBODY.children);

        masterTRs.forEach((tr) => {
          expect(tr.style.display).not.toBe('none');
        });
      });

      it('should keep the master TABLE flush with the bottom overlay\'s TABLE when no scroll is needed', async() => {
        // Existing layout invariant (the equivalent test in `bottomOverlay.spec.js` covers it
        // without the hide code path): when the holder is taller than the data, the master
        // renders all rows naturally and the bottom overlay sits flush against the data's
        // bottom. The hide must NOT fire here, otherwise the master TABLE would end higher
        // than the overlay TABLE.
        createDataArray(6, 6);
        spec().$wrapper.width(400).height(300);

        const wt = walkontable({
          data: getData,
          totalRows: getTotalRows,
          totalColumns: getTotalColumns,
          fixedRowsBottom: 2,
        });

        wt.draw();

        const masterTRs = Array.from(wt.wtTable.TBODY.children);

        masterTRs.forEach((tr) => {
          expect(tr.style.display).not.toBe('none');
        });
      });
    });
  });
});
