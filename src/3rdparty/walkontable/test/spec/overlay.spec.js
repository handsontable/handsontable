describe('WalkontableOverlay', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(200).height(200);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);

    $('.jasmine_html-reporter').hide(); // Workaround for making the test more predictable.
  });

  afterEach(function() {
    $('.jasmine_html-reporter').show(); // Workaround for making the test more predictable.

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('cloned overlays have to have proper dimensions (overflow hidden)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(200);
    expect($(wt.wtTable.holder).height()).toBe(200);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(185); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).height()).toBe(185);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(185);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('cloned overlays have to have proper dimensions (window object as scrollable element)', () => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('cloned overlays have to have proper dimensions after table scroll (overflow hidden)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
    });

    wt.draw();
    wt.scrollViewportHorizontally(getTotalColumns() - 1);
    wt.scrollViewportVertically(getTotalRows() - 3); // -1 - 2 (fixedRowsBottom)
    wt.draw();

    expect($(wt.wtTable.holder).width()).toBe(200);
    expect($(wt.wtTable.holder).height()).toBe(200);
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).width()).toBe(185); // 200px - 15px scrollbar width
    expect($(wt.wtOverlays.topOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).height()).toBe(185);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(185);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('cloned overlays have to have proper dimensions after table scroll (window object as scrollable element)', () => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.leftOverlay.clone.wtTable.holder).height()).toBe(clientHeight);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).width()).toBe(100);
    expect($(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable.holder).height()).toBe(47);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).width()).toBe(totalColumnsWidth);
    expect($(wt.wtOverlays.bottomOverlay.clone.wtTable.holder).height()).toBe(47);
  });

  it('cloned overlays have to have proper positions (overflow hidden)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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

    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 208,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 55,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 55,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.leftOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 193,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 146,
      bottom: 193,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 146,
      bottom: 193,
      left: 8,
    }));
  });

  it('cloned overlays have to have proper positions (window object as scrollable element)', () => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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

    const documentClientHeight = document.documentElement.clientHeight;
    const totalRowsHight = (getTotalRows() * 23) + 1; // total columns * 23px + 1px cell top border
    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: totalRowsHight + 8, // 8 default browser margin
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 47 + 8, // 2 fixed top rows * 23px + body margin
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 47 + 8, // 2 fixed top rows * 23px + body margin
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.leftOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: totalRowsHight + 8, // 8 default browser margin
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - 47, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - 47, // 2 fixed bottom rows * 23px + 1px cell top border
      bottom: documentClientHeight,
      left: 8,
    }));
  });

  it('cloned overlays have to have proper positions after table scroll (overflow hidden)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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

    const baseRect = getTableRect(wt.wtTable);

    expect(baseRect).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 208,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 55,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 55,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.leftOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 8,
      bottom: 193,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 146,
      bottom: 193,
      left: 8,
    }));
    expect(getTableRect(wt.wtOverlays.bottomOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 146,
      bottom: 193,
      left: 8,
    }));
  });

  it('cloned overlays have to have proper positions after table scroll (window object as scrollable element)', () => {
    spec().$wrapper
      .css('overflow', '')
      .css('width', '')
      .css('height', '');

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
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
    expect(getTableRect(wt.wtOverlays.topLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: 0,
      bottom: 47,
      left: 0,
    }));
    expect(getTableRect(wt.wtOverlays.leftOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
      top: documentClientHeight - totalRowsHeight,
      bottom: documentClientHeight,
      left: 0,
    }));
    expect(getTableRect(wt.wtOverlays.bottomLeftCornerOverlay.clone.wtTable)).toEqual(jasmine.objectContaining({
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

  it('cloned overlays have to have all borders when an empty dataset is passed', () => {
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
});
