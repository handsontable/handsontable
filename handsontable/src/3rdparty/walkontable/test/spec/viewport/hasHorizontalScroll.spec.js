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

  describe('hasHorizontalScroll()', () => {
    it('should return `false` when the table\'s viewport is the same as dataset size (defined table size)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(300).height(139);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `false` when the table\'s viewport is bigger than dataset size (defined table size)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(400).height(200);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `true` when the table\'s width viewport is lower than dataset size (defined table size)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(299).height(139);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when the table\'s height viewport is lower than dataset size (defined table size)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(300).height(138);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `false` when the table\'s viewport is the same as dataset size (defined table size, custom column widths)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(240).height(139);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(index) {
          return index % 2 ? 30 : 50;
        },
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `false` when the table\'s viewport is bigger than dataset size (defined table size, custom row heights)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(400).height(139);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(index) {
          return index % 2 ? 30 : 50;
        },
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);
    });

    it('should return `true` when the table\'s width viewport is lower than dataset size (defined table size, custom row heights)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(239).height(139);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(index) {
          return index % 2 ? 30 : 50;
        },
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when the table\'s height viewport is lower than dataset size (defined table size, custom row heights)', () => {
      createDataArray(6, 6);

      spec().$wrapper.width(240).height(138);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth(index) {
          return index % 2 ? 30 : 50;
        },
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `false` when the table\'s viewport is the same as dataset size (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'auto' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(6, 1);

      function stretchColumns() {
        return window.innerWidth - spec().$wrapper.offset().left;
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: stretchColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      $(document.body).css({ overflowY: 'scroll' });
    });

    it('should return `true` when the table\'s width viewport is lower than dataset size (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'auto' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(6, 1);

      function stretchColumns() {
        return window.innerWidth - spec().$wrapper.offset().left + 1;
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: stretchColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      $(document.body).css({ overflowY: 'scroll' });
    });

    it('should return `true` when the table\'s height viewport is lower than dataset size (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'auto' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(1, 1);

      function stretchColumns() {
        return window.innerWidth - spec().$wrapper.offset().left;
      }
      function stretchRows() {
        return window.innerHeight - spec().$wrapper.offset().top - BODY_MARGIN;
      }

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: stretchColumns,
        rowHeight: stretchRows,
        rowHeightByOverlayName: stretchRows,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      $(document.body).css({ overflowY: 'scroll' });
    });

    it('should return `false` when there is no window horizontal scroll (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'auto' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(6, 1);

      const windowWidth = window.innerWidth - BODY_MARGIN - 50; // 50 is table width

      spec().$wrapper.css({ paddingLeft: `${windowWidth}px` });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(false);

      $(document.body).css({ overflowY: 'scroll' });
    });

    it('should return `true` when there is window vertical scroll (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'scroll' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(6, 1);

      const windowWidth = window.innerWidth - BODY_MARGIN - 50; // 50 is table width

      spec().$wrapper.css({ paddingLeft: `${windowWidth}px` });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.prepare();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);

      wt.draw();

      expect(wt.wtViewport.hasHorizontalScroll()).toBe(true);
    });

    it('should return `true` when there is window vertical scroll and the viewport is scrolled (window as scrollable element)', () => {
      $(document.body).css({ overflowY: 'scroll' });
      spec().$wrapper.css({ width: '', height: '', overflow: '' });
      createDataArray(1, 6);

      const windowWidth = window.innerWidth * 2;

      spec().$wrapper.css({ paddingLeft: `${windowWidth}px` });

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });

      wt.draw();
      setScrollLeft(windowWidth); // scroll to the most right
      wt.draw();

      expect(wt.wtViewport.hasVerticalScroll()).toBe(true);

      $(document.body).css({ overflowY: 'scroll' });
    });
  });
});
