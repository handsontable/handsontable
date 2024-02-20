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

  describe('isRowAfterViewport()', () => {
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

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(10), 'master').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(11), 'master').toBe(true);

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(17), 'bottomInlineStartCorner').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(18), 'bottomInlineStartCorner').toBe(true);

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(17), 'bottom').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(18), 'bottom').toBe(true);

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(10), 'inlineStart').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(11), 'inlineStart').toBe(true);

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(1), 'topInlineStartCorner').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(2), 'topInlineStartCorner').toBe(true);

      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(1), 'top').toBe(false);
      expectWtTable(wt, wtTable => wtTable.isRowAfterViewport(2), 'top').toBe(true);
    });
  });
});
