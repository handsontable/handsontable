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

  describe('getFirstRenderedRow()', () => {
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

      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'master').toBe(-1);

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottomInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottom').toBe(-1);

      expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'inlineStart').toBe(-1);

      expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'topInlineStartCorner').toBe(-1);

      expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'top').toBe(-1);
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

      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'master').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottomInlineStartCorner').toBe(16);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottom').toBe(16);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'inlineStart').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'topInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'top').toBe(0);
    });

    it('should return source index even for partially visible row (the first row is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });

    it('should return source index even for partially visible row (the first row is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(3);
    });

    it('should return 0 as the first rendered row, when there\'s more fixed bottom rows than rows in total', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: [[1], [1]],
        totalRows: 2,
        totalColumns: 1,
        fixedRowsBottom: 3,
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'master').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottom').toBe(0);
    });
  });
});
