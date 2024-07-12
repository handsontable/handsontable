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

  describe('isVisible()', () => {
    it('should return `false` when holder element is hidden', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtTable.isVisible()).toBe(true);

      spec().$wrapper.css({ display: 'none' });
      wt.draw();

      expect(wt.wtTable.isVisible()).toBe(false);
    });
  });
});
