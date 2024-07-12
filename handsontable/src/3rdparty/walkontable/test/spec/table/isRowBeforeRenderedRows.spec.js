describe('WalkontableTable', () => {
  const debug = false;

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

  describe('isRowBeforeRenderedRows()', () => {
    it('should return value that is relevant to a given overlay', () => {
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
      wt.scrollViewportVertically(10);
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(7), 'master').toBe(true);
      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(8), 'master').toBe(false);

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(15), 'bottomInlineStartCorner').toBe(true);
      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(16), 'bottomInlineStartCorner').toBe(false);

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(15), 'bottom').toBe(true);
      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(16), 'bottom').toBe(false);

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(7), 'inlineStart').toBe(true);
      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(8), 'inlineStart').toBe(false);

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(0), 'topInlineStartCorner').toBe(false);

      expectWtTable(wt, wtTable => wtTable.isRowBeforeRenderedRows(0), 'top').toBe(false);
    });
  });
});
