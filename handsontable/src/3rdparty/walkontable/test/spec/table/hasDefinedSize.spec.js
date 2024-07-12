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

  describe('hasDefinedSize()', () => {
    it('should return `false` when the table is initialized in the container which the size doesn\'t set.', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(true);

      spec().$wrapper.css({ width: '', height: '' });
      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(false);

      spec().$wrapper.css({ width: '100px', height: '100px' });
      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(true);
    });
  });
});
