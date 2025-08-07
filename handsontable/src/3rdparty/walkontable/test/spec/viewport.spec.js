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
    it('should return correct viewport width in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth()).toBe(200);
    });

    it('should return correct viewport width in case when the table has not defined size', async() => {
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

    it('should return correct viewport width including row header widths', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { { TH.innerHTML = col; } },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceWidth()).toBe(200);
    });
  });

  describe('getWorkspaceHeight()', () => {
    it('should return correct viewport height in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(200);
    });

    it('should return correct viewport height in case when the table has not defined size', async() => {
      spec().$wrapper
        .css('overflow', '')
        .css('width', '')
        .css('height', '');

      createDataArray(1, 10);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(window.innerHeight);
    });

    it('should return correct viewport height including column header heights', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getWorkspaceHeight()).toBe(200);
    });
  });

  describe('getViewportWidth()', () => {
    it('should return correct viewport width in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportWidth()).toBe(200);
    });

    it('should return viewport width without including the row headers width', async() => {
      createDataArray(10, 2);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getViewportWidth()).toBe(100);
    });

    it('should return correct viewport width in case when the table has not defined size', async() => {
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

      expect(wt.wtViewport.getViewportWidth())
        .toBe(document.documentElement.offsetWidth - (BODY_MARGIN * 2)); // body margin from the left and right
    });
  });

  describe('getViewportHeight()', () => {
    it('should return correct viewport height in case when the root element has defined size', async() => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.getViewportHeight()).toBe(200);
    });

    it('should return viewport height without including the column headers height', async() => {
      createDataArray(10, 2);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => { TH.innerHTML = col; },
          (col, TH) => { TH.innerHTML = col; },
        ],
        rowHeaders: [
          (row, TH) => { TH.innerHTML = row; },
        ]
      });

      wt.draw();

      expect(wt.wtViewport.getViewportHeight()).toBe(154);
    });

    it('should return correct viewport height in case when the table has not defined size', async() => {
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

      expect(wt.wtViewport.getViewportHeight()).toBe(window.innerHeight);
    });
  });

  describe('hasVerticalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset', async() => {
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

    it('should return `true` when the dataset is bigger than table\'s viewport', async() => {
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

    it('should return `true` when the viewport height is the same as total height of all rows (#dev-2248)', async() => {
      createDataArray(13, 15);

      spec().$wrapper.width(500).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasVerticalScroll()).toBe(true);
    });
  });

  describe('hasHorizontalScroll()', () => {
    it('should return `false` when the table\'s viewport is bigger than dataset width', async() => {
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

    it('should return `false` when the table\'s viewport is the same as dataset width', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(515).height(300); // +15px scrollbar width

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `true` when the table\'s viewport is 1px bigger than dataset width', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(514).height(300); // +15px scrollbar width - 1px to trigger horizontal scroll

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when the dataset is much bigger than table\'s viewport', async() => {
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

    it('should return `true` when the viewport width is the same as total width of all columns (#dev-2248)', async() => {
      createDataArray(50, 10);

      spec().$wrapper.width(500).height(300);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });
  });
});
