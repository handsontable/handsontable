describe('WalkontableViewport', () => {
  const BODY_MARGIN = parseInt(getComputedStyle(document.body).margin, 10);
  const OUTER_WIDTH = 200;
  const OUTER_HEIGHT = 200;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(OUTER_WIDTH).height(OUTER_HEIGHT);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');

    createDataArray(200, 200);
  });

  afterEach(function() {
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('getWorkspaceWidth()', () => {
    it('should return correct viewport width in case when the root element has defined size', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth()).toBe(200);
    });

    it('should return correct viewport width in case when the table has not defined size', () => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(20, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth())
        .toBe(document.documentElement.offsetWidth - (BODY_MARGIN * 2)); // body margin from the left and right
    });
  });

  describe('hasVerticalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset', () => {
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

      expect(wt.wtViewport.hasVerticalScroll()).toBe(false);
    });

    it('should return `true` when the dataset is bigger than table\'s viewport', () => {
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

      expect(wt.wtViewport.hasVerticalScroll()).toBe(true);
    });
  });

  describe('hasHorizontalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset', () => {
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

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `true` when the dataset is bigger than table\'s viewport', () => {
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

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });
  });
});
