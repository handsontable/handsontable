describe('transform', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(500).height(500);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 100);
  });

  afterEach(function() {
    $('.wtHolder').remove();

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('.wtHolder has a correct size under a scale transform', () => {
    it('scale(0.5)', function() {
      this.$wrapper.css('transform', 'scale(0.5)');
      this.$wrapper.css('transform-origin', 'top left');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.holder.offsetWidth).toEqual(500);
      expect(wt.wtTable.holder.offsetHeight).toEqual(500);

      expect(wt.wtTable.holder.getBoundingClientRect().width).toEqual(250);
      expect(wt.wtTable.holder.getBoundingClientRect().height).toEqual(250);
    });

    it('scale(2)', function() {
      this.$wrapper.css('transform', 'scale(2)');
      this.$wrapper.css('transform-origin', 'top left');

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.holder.offsetWidth).toEqual(500);
      expect(wt.wtTable.holder.offsetHeight).toEqual(500);

      expect(wt.wtTable.holder.getBoundingClientRect().width).toEqual(1000);
      expect(wt.wtTable.holder.getBoundingClientRect().height).toEqual(1000);
    });
  });
});
