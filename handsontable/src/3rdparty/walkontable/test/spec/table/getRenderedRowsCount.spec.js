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

  describe('getRenderedRowsCount()', () => {
    it('should return 0 if there are no rendered rows and columns', () => {
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

      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'master').toBe(0);

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottomInlineStartCorner').toBe(0);

      expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottom').toBe(0);

      expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'inlineStart').toBe(0);

      expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'topInlineStartCorner').toBe(0);

      expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'top').toBe(0);
    });

    it('should return sum that is relevant to a given overlay', () => {
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

      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottomInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'inlineStart').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'topInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'top').toBe(2);
    });

    it('should return rows count only for fully visible rows', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);

      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);

      // Scroll the table in that way that the first and last row i partially visible
      wt.wtOverlays.topOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);
    });
  });
});
