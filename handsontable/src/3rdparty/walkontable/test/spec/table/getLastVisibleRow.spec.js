describe('WalkontableTable', () => {
  const debug = false;

  function hotParentName(TH) {
    const hotParent = TH.parentElement.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement;
    const classes = hotParent.className.split(' ');

    return classes[0];
  }

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
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

  describe('getLastVisibleRow()', () => {
    it('should return -1 error code if there are no rendered rows and columns', () => {
      createDataArray(0, 0);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
        }],
        rowHeaders: [function(row, TH) {
          TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
        }]
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(-1);

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(-1);

      expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'inlineStart').toBe(-1);

      expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(-1);
    });

    it('should return -1 error code if there are rendered rows and columns after fixed overlays are disabled', () => {
      createDataArray(4, 4);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        columnHeaders: [function(col, TH) {
          TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
        }],
        rowHeaders: [function(row, TH) {
          TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
        }]
      });

      wt.draw();
      wt.wtSettings.update('fixedRowsTop', 0);
      wt.wtSettings.update('fixedRowsBottom', 0);
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(3);

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(-1);

      expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(-1);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomInlineStartCorner').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'inlineStart').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topInlineStartCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(1);
    });

    it('should return source index only for fully visible row (the last row is partially visible)', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getLastVisibleRow()).toBe(5);
    });

    it('should return source index only for fully visible row (the last row is fully visible)', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportVertically(7);
      wt.draw();

      expect(wt.wtTable.getLastVisibleRow()).toBe(7);
    });
  });
});
