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

  describe('isLastColumnFullyVisible()', () => {
    it('should be false because it is only partially visible', () => {
      createDataArray(18, 4);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toBe(false);
    });

    it('should be true because it is fully visible', () => {
      createDataArray(18, 4);
      spec().$wrapper.width(180).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(3);
      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toBe(true);
    });
  });
});
