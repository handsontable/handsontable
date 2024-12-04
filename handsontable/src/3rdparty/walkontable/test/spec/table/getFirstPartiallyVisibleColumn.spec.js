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

  describe('getFirstPartiallyVisibleColumn()', () => {
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

      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'master').toBe(-1);

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'bottomInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'bottom').toBe(-1);

      expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'inlineStart').toBe(-1);

      expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'topInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'top').toBe(-1);
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

      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'master').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'bottomInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'inlineStart').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'topInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstPartiallyVisibleColumn(), 'top').toBe(2);
    });

    it('should return the same column index as for fully visible column when the column is aligned to the left edge of the table', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewport({ row: 0, col: 1 }, 'start', 'top');
      wt.draw();

      expect(wt.wtTable.getFirstPartiallyVisibleColumn()).toBe(1);
      expect(wt.wtTable.getFirstVisibleColumn()).toBe(1);
    });

    it('should return source index only for partially visible column', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getFirstPartiallyVisibleColumn()).toBe(4);
    });
  });
});
