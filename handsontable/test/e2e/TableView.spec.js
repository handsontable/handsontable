describe('TableView', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('scrollViewport()', () => {
    it('should not throw error after scrolling the viewport to 0, 0 (empty data)', () => {
      spec().$container[0].style.width = '400px';

      const hot1 = handsontable({
        data: [],
        height: 100
      });

      expect(() => {
        hot1.view.scrollViewport({ row: 0, col: 0 });
      }).not.toThrow();
    });

    it('should throw error after scrolling the viewport below 0 (empty data)', () => {
      spec().$container[0].style.width = '400px';

      const hot1 = handsontable({
        data: [],
        height: 100
      });

      expect(hot1.view.scrollViewport({ row: -1, col: 0 })).toBe(false);
      expect(hot1.view.scrollViewport({ row: 0, col: -1 })).toBe(false);
      expect(hot1.view.scrollViewport({ row: -1, col: -1 })).toBe(false);
    });
  });

  // TODO fix these tests - https://github.com/handsontable/handsontable/issues/1559
  describe('maximumVisibleElementWidth()', () => {
    it('should return maximum width until right edge of the viewport', () => {
      const hot = handsontable({
        startRows: 2,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementWidth(0)).toBe(100);
    });

    it('should return maximum width until right edge of the viewport (excluding the scrollbar)', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementWidth(200)).toBeLessThan(100);
    });
  });

  describe('maximumVisibleElementHeight()', () => {
    it('should return maximum height until bottom edge of the viewport', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 2,
        width: 120,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementHeight(0)).toBe(100);
    });

    it('should return maximum height until bottom edge of the viewport (excluding the scrollbar)', () => {
      const hot = handsontable({
        startRows: 10,
        startCols: 10,
        width: 120,
        height: 100,
      });

      expect(hot.view.maximumVisibleElementHeight()).toBeLessThan(100);
    });
  });

  describe('getColumnHeadersCount()', () => {
    it('should return 0 when there is no column headers rendered (`colHeaders` has `false`)', () => {
      const hot = handsontable({
        colHeaders: false,
      });

      expect(hot.view.getColumnHeadersCount(0)).toBe(0);
    });

    it('should return 1 when there is no column headers rendered (`colHeaders` has `true`)', () => {
      const hot = handsontable({
        colHeaders: true,
      });

      expect(hot.view.getColumnHeadersCount(0)).toBe(1);
    });

    it('should return the number of column headers as actually added', () => {
      const hot = handsontable({
        colHeaders: true,
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 2);
          });
        },
      });

      expect(hot.view.getColumnHeadersCount(0)).toBe(3);
    });
  });

  describe('getRowHeadersCount()', () => {
    it('should return 0 when there is no row headers rendered (`rowHeaders` has `false`)', () => {
      const hot = handsontable({
        rowHeaders: false,
      });

      expect(hot.view.getRowHeadersCount(0)).toBe(0);
    });

    it('should return 1 when there is no column headers rendered (`rowHeaders` has `true`)', () => {
      const hot = handsontable({
        rowHeaders: true,
      });

      expect(hot.view.getRowHeadersCount(0)).toBe(1);
    });

    it('should return the number of column headers as actually added', () => {
      const hot = handsontable({
        colHeaders: true,
        afterGetRowHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedRowIndex, TH) => {
            TH.innerText = this.getRowHeader(renderedRowIndex, 0);
          });
          renderers.push((renderedRowIndex, TH) => {
            TH.innerText = this.getRowHeader(renderedRowIndex, 1);
          });
          renderers.push((renderedRowIndex, TH) => {
            TH.innerText = this.getRowHeader(renderedRowIndex, 2);
          });
        },
      });

      expect(hot.view.getRowHeadersCount(0)).toBe(3);
    });
  });
});
