describe('WalkontableOverlay', () => {
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;

  const getBottom = element => element.getBoundingClientRect().bottom;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);

    $('.jasmine_html-reporter').hide(); // Workaround for making the test more predictable.
  });

  afterEach(function() {
    $('.jasmine_html-reporter').show(); // Workaround for making the test more predictable.

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('bottom inline-start corner overlay', () => {
    it('should have to have proper position when the table viewport is bigger than dataset', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(getBottom(wt.wtTable.TABLE))
        .toBe(getBottom(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.TABLE));
    });

    it('should have to have proper position when the vertical scrollbar appears', () => {
      createDataArray(50, 6);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.wtRootElement.style.bottom)
        .toBe('0px');
    });

    it('should have to have proper position when the horizontal scrollbar appears', () => {
      createDataArray(6, 50);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(getBottom(wt.wtTable.TABLE))
        .toBe(getBottom(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.TABLE));
    });

    it('should have to have proper position when the vertical and horizontal scrollbars appear', () => {
      createDataArray(50, 50);

      spec().$wrapper.width(400).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
      });

      wt.draw();

      expect(wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.wtRootElement.style.bottom)
        .toBe('15px'); // scrollbar height
    });
  });
});
