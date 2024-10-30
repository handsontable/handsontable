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

  describe('countRenderableColumnsInRange()', () => {
    it('should return 0 if dataset is empty', () => {
      const hot = handsontable({
        data: [],
      });

      expect(hot.view.countRenderableColumnsInRange(0, 100)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(0, 0)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(1, 1)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(1, 2)).toBe(0);
    });

    it('should return count of renderable columns depends on the passed range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(hot.view.countRenderableColumnsInRange(0, 100)).toBe(5);
      expect(hot.view.countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(0, 0)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(1, 1)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(1, 2)).toBe(2);
      expect(hot.view.countRenderableColumnsInRange(4, 5)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(1, 5)).toBe(4);
      expect(hot.view.countRenderableColumnsInRange(-1, 3)).toBe(4);
    });

    it('should return count of renderable columns depends on the passed range when some columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      hot.render();

      expect(hot.view.countRenderableColumnsInRange(0, 100)).toBe(2);
      expect(hot.view.countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(0, 0)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(1, 1)).toBe(0);
      expect(hot.view.countRenderableColumnsInRange(2, 2)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(0, 2)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(4, 5)).toBe(1);
      expect(hot.view.countRenderableColumnsInRange(1, 5)).toBe(2);
      expect(hot.view.countRenderableColumnsInRange(-1, 3)).toBe(1);
    });
  });

  describe('countRenderableRowsInRange()', () => {
    it('should return 0 if dataset is empty', () => {
      const hot = handsontable({
        data: [],
      });

      expect(hot.view.countRenderableRowsInRange(0, 100)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(0, 0)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(1, 1)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(2, 1)).toBe(0);
    });

    it('should return count of renderable rows depends on the passed range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(hot.view.countRenderableRowsInRange(0, 100)).toBe(5);
      expect(hot.view.countRenderableRowsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(0, 0)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(1, 1)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(1, 2)).toBe(2);
      expect(hot.view.countRenderableRowsInRange(4, 5)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(1, 5)).toBe(4);
      expect(hot.view.countRenderableRowsInRange(-1, 3)).toBe(4);
    });

    it('should return count of renderable rows depends on the passed range when some rows are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      hot.render();

      expect(hot.view.countRenderableRowsInRange(0, 100)).toBe(2);
      expect(hot.view.countRenderableRowsInRange(100, 0)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(0, 0)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(1, 1)).toBe(0);
      expect(hot.view.countRenderableRowsInRange(2, 2)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(0, 2)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(4, 5)).toBe(1);
      expect(hot.view.countRenderableRowsInRange(1, 5)).toBe(2);
      expect(hot.view.countRenderableRowsInRange(-1, 3)).toBe(1);
    });
  });

  describe('getFirstFullyVisibleRow()', () => {
    it('should internally call `getFirstVisibleRow` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getFirstVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getFirstFullyVisibleRow()).toBe(2);
      expect(hot.view._wt.wtScroll.getFirstVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastFullyVisibleRow()', () => {
    it('should internally call `getLastVisibleRow` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getLastVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getLastFullyVisibleRow()).toBe(2);
      expect(hot.view._wt.wtScroll.getLastVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstFullyVisibleColumn()', () => {
    it('should internally call `getFirstVisibleColumn` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getFirstVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getFirstFullyVisibleColumn()).toBe(2);
      expect(hot.view._wt.wtScroll.getFirstVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastFullyVisibleColumn()', () => {
    it('should internally call `getLastVisibleColumn` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getLastVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getLastFullyVisibleColumn()).toBe(2);
      expect(hot.view._wt.wtScroll.getLastVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstPartiallyVisibleRow()', () => {
    it('should internally call `getFirstPartiallyVisibleRow` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getFirstPartiallyVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getFirstPartiallyVisibleRow()).toBe(2);
      expect(hot.view._wt.wtScroll.getFirstPartiallyVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastPartiallyVisibleRow()', () => {
    it('should internally call `getLastPartiallyVisibleRow` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getLastPartiallyVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getLastPartiallyVisibleRow()).toBe(2);
      expect(hot.view._wt.wtScroll.getLastPartiallyVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstPartiallyVisibleColumn()', () => {
    it('should internally call `getFirstPartiallyVisibleColumn` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getFirstPartiallyVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getFirstPartiallyVisibleColumn()).toBe(2);
      expect(hot.view._wt.wtScroll.getFirstPartiallyVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastPartiallyVisibleColumn()', () => {
    it('should internally call `getLastPartiallyVisibleColumn` method of the Scroll module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtScroll, 'getLastPartiallyVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(hot.view.getLastPartiallyVisibleColumn()).toBe(2);
      expect(hot.view._wt.wtScroll.getLastPartiallyVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getViewportWidth()', () => {
    it('should internally call `getViewportWidth` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getViewportWidth').and.returnValue(100);

      expect(hot.view.getViewportWidth()).toBe(100);
      expect(hot.view._wt.wtViewport.getViewportWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkspaceWidth()', () => {
    it('should internally call `getWorkspaceWidth` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getWorkspaceWidth').and.returnValue(100);

      expect(hot.view.getWorkspaceWidth()).toBe(100);
      expect(hot.view._wt.wtViewport.getWorkspaceWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getViewportHeight()', () => {
    it('should internally call `getViewportHeight` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getViewportHeight').and.returnValue(100);

      expect(hot.view.getViewportHeight()).toBe(100);
      expect(hot.view._wt.wtViewport.getViewportHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkspaceHeight()', () => {
    it('should internally call `getWorkspaceHeight` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getWorkspaceHeight').and.returnValue(100);

      expect(hot.view.getWorkspaceHeight()).toBe(100);
      expect(hot.view._wt.wtViewport.getWorkspaceHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasVerticalScroll()', () => {
    it('should internally call `hasVerticalScroll` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'hasVerticalScroll').and.returnValue(100);

      expect(hot.view.hasVerticalScroll()).toBe(100);
      expect(hot.view._wt.wtViewport.hasVerticalScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasHorizontalScroll()', () => {
    it('should internally call `hasHorizontalScroll` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'hasHorizontalScroll').and.returnValue(100);

      expect(hot.view.hasHorizontalScroll()).toBe(100);
      expect(hot.view._wt.wtViewport.hasHorizontalScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableWidth()', () => {
    it('should internally call `getTableWidth` method of the Table module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtTable, 'getWidth').and.returnValue(100);

      expect(hot.view.getTableWidth()).toBe(100);
      expect(hot.view._wt.wtTable.getWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableHeight()', () => {
    it('should internally call `getTableHeight` method of the Table module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtTable, 'getHeight').and.returnValue(100);

      expect(hot.view.getTableHeight()).toBe(100);
      expect(hot.view._wt.wtTable.getHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRowHeaderWidth()', () => {
    it('should internally call `getRowHeaderWidth` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getRowHeaderWidth').and.returnValue(100);

      expect(hot.view.getRowHeaderWidth()).toBe(100);
      expect(hot.view._wt.wtViewport.getRowHeaderWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getColumnHeaderHeight()', () => {
    it('should internally call `getColumnHeaderHeight` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'getColumnHeaderHeight').and.returnValue(100);

      expect(hot.view.getColumnHeaderHeight()).toBe(100);
      expect(hot.view._wt.wtViewport.getColumnHeaderHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('isVerticallyScrollableByWindow()', () => {
    it('should internally call `isVerticallyScrollableByWindow` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'isVerticallyScrollableByWindow').and.returnValue(true);

      expect(hot.view.isVerticallyScrollableByWindow()).toBe(true);
      expect(hot.view._wt.wtViewport.isVerticallyScrollableByWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('isHorizontallyScrollableByWindow()', () => {
    it('should internally call `isHorizontallyScrollableByWindow` method of the Viewport module of the Walkontable', () => {
      const hot = handsontable({});

      spyOn(hot.view._wt.wtViewport, 'isHorizontallyScrollableByWindow').and.returnValue(true);

      expect(hot.view.isHorizontallyScrollableByWindow()).toBe(true);
      expect(hot.view._wt.wtViewport.isHorizontallyScrollableByWindow).toHaveBeenCalledTimes(1);
    });
  });
});
