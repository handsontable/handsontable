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
    it('should not throw error after scrolling the viewport to 0, 0 (empty data)', async() => {
      spec().$container[0].style.width = '400px';

      const hot1 = handsontable({
        data: [],
        height: 100
      });

      expect(() => {
        hot1.view.scrollViewport({ row: 0, col: 0 });
      }).not.toThrow();
    });

    it('should throw error after scrolling the viewport below 0 (empty data)', async() => {
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
    it('should return maximum width until right edge of the viewport', async() => {
      handsontable({
        startRows: 2,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(tableView().maximumVisibleElementWidth(0)).toBe(100);
    });

    it('should return maximum width until right edge of the viewport (excluding the scrollbar)', async() => {
      handsontable({
        startRows: 10,
        startCols: 10,
        width: 100,
        height: 100,
      });

      expect(tableView().maximumVisibleElementWidth(200)).toBeLessThan(100);
    });
  });

  describe('maximumVisibleElementHeight()', () => {
    it('should return maximum height until bottom edge of the viewport', async() => {
      handsontable({
        startRows: 10,
        startCols: 2,
        width: 120,
        height: 100,
      });

      expect(tableView().maximumVisibleElementHeight(0)).toBe(100);
    });

    it('should return maximum height until bottom edge of the viewport (excluding the scrollbar)', async() => {
      handsontable({
        startRows: 10,
        startCols: 10,
        width: 120,
        height: 100,
      });

      expect(tableView().maximumVisibleElementHeight()).toBeLessThan(100);
    });
  });

  describe('getColumnHeadersCount()', () => {
    it('should return 0 when there is no column headers rendered (`colHeaders` has `false`)', async() => {
      handsontable({
        colHeaders: false,
      });

      expect(tableView().getColumnHeadersCount(0)).toBe(0);
    });

    it('should return 1 when there is no column headers rendered (`colHeaders` has `true`)', async() => {
      handsontable({
        colHeaders: true,
      });

      expect(tableView().getColumnHeadersCount(0)).toBe(1);
    });

    it('should return the number of column headers as actually added', async() => {
      handsontable({
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

      expect(tableView().getColumnHeadersCount(0)).toBe(3);
    });
  });

  describe('getRowHeadersCount()', () => {
    it('should return 0 when there is no row headers rendered (`rowHeaders` has `false`)', async() => {
      handsontable({
        rowHeaders: false,
      });

      expect(tableView().getRowHeadersCount(0)).toBe(0);
    });

    it('should return 1 when there is no column headers rendered (`rowHeaders` has `true`)', async() => {
      handsontable({
        rowHeaders: true,
      });

      expect(tableView().getRowHeadersCount(0)).toBe(1);
    });

    it('should return the number of column headers as actually added', async() => {
      handsontable({
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

      expect(tableView().getRowHeadersCount(0)).toBe(3);
    });
  });

  describe('countRenderableColumnsInRange()', () => {
    it('should return 0 if dataset is empty', async() => {
      handsontable({
        data: [],
      });

      expect(tableView().countRenderableColumnsInRange(0, 100)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(0, 0)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(1, 1)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(1, 2)).toBe(0);
    });

    it('should return count of renderable columns depends on the passed range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(tableView().countRenderableColumnsInRange(0, 100)).toBe(5);
      expect(tableView().countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(0, 0)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(1, 1)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(1, 2)).toBe(2);
      expect(tableView().countRenderableColumnsInRange(4, 5)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(1, 5)).toBe(4);
      expect(tableView().countRenderableColumnsInRange(-1, 3)).toBe(4);
    });

    it('should return count of renderable columns depends on the passed range when some columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true); // Hide column that contains cells A{n}
      hidingMap.setValueAtIndex(1, true); // Hide column that contains cells B{n}
      hidingMap.setValueAtIndex(3, true); // Hide column that contains cells D{n}
      await render();

      expect(tableView().countRenderableColumnsInRange(0, 100)).toBe(2);
      expect(tableView().countRenderableColumnsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(0, 0)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(1, 1)).toBe(0);
      expect(tableView().countRenderableColumnsInRange(2, 2)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(0, 2)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(4, 5)).toBe(1);
      expect(tableView().countRenderableColumnsInRange(1, 5)).toBe(2);
      expect(tableView().countRenderableColumnsInRange(-1, 3)).toBe(1);
    });
  });

  describe('countRenderableRowsInRange()', () => {
    it('should return 0 if dataset is empty', async() => {
      handsontable({
        data: [],
      });

      expect(tableView().countRenderableRowsInRange(0, 100)).toBe(0);
      expect(tableView().countRenderableRowsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableRowsInRange(0, 0)).toBe(0);
      expect(tableView().countRenderableRowsInRange(1, 1)).toBe(0);
      expect(tableView().countRenderableRowsInRange(2, 1)).toBe(0);
    });

    it('should return count of renderable rows depends on the passed range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      expect(tableView().countRenderableRowsInRange(0, 100)).toBe(5);
      expect(tableView().countRenderableRowsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableRowsInRange(0, 0)).toBe(1);
      expect(tableView().countRenderableRowsInRange(1, 1)).toBe(1);
      expect(tableView().countRenderableRowsInRange(1, 2)).toBe(2);
      expect(tableView().countRenderableRowsInRange(4, 5)).toBe(1);
      expect(tableView().countRenderableRowsInRange(1, 5)).toBe(4);
      expect(tableView().countRenderableRowsInRange(-1, 3)).toBe(4);
    });

    it('should return count of renderable rows depends on the passed range when some rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(3, true);
      await render();

      expect(tableView().countRenderableRowsInRange(0, 100)).toBe(2);
      expect(tableView().countRenderableRowsInRange(100, 0)).toBe(0);
      expect(tableView().countRenderableRowsInRange(0, 0)).toBe(0);
      expect(tableView().countRenderableRowsInRange(1, 1)).toBe(0);
      expect(tableView().countRenderableRowsInRange(2, 2)).toBe(1);
      expect(tableView().countRenderableRowsInRange(0, 2)).toBe(1);
      expect(tableView().countRenderableRowsInRange(4, 5)).toBe(1);
      expect(tableView().countRenderableRowsInRange(1, 5)).toBe(2);
      expect(tableView().countRenderableRowsInRange(-1, 3)).toBe(1);
    });
  });

  describe('getFirstFullyVisibleRow()', () => {
    it('should internally call `getFirstVisibleRow` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getFirstVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getFirstFullyVisibleRow()).toBe(2);
      expect(tableView()._wt.wtScroll.getFirstVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastFullyVisibleRow()', () => {
    it('should internally call `getLastVisibleRow` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getLastVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getLastFullyVisibleRow()).toBe(2);
      expect(tableView()._wt.wtScroll.getLastVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstFullyVisibleColumn()', () => {
    it('should internally call `getFirstVisibleColumn` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getFirstVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getFirstFullyVisibleColumn()).toBe(2);
      expect(tableView()._wt.wtScroll.getFirstVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastFullyVisibleColumn()', () => {
    it('should internally call `getLastVisibleColumn` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getLastVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getLastFullyVisibleColumn()).toBe(2);
      expect(tableView()._wt.wtScroll.getLastVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstPartiallyVisibleRow()', () => {
    it('should internally call `getFirstPartiallyVisibleRow` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getFirstPartiallyVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getFirstPartiallyVisibleRow()).toBe(2);
      expect(tableView()._wt.wtScroll.getFirstPartiallyVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastPartiallyVisibleRow()', () => {
    it('should internally call `getLastPartiallyVisibleRow` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getLastPartiallyVisibleRow').and.returnValue(1);
      spyOn(hot.rowIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getLastPartiallyVisibleRow()).toBe(2);
      expect(tableView()._wt.wtScroll.getLastPartiallyVisibleRow).toHaveBeenCalledTimes(1);
      expect(hot.rowIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getFirstPartiallyVisibleColumn()', () => {
    it('should internally call `getFirstPartiallyVisibleColumn` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getFirstPartiallyVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getFirstPartiallyVisibleColumn()).toBe(2);
      expect(tableView()._wt.wtScroll.getFirstPartiallyVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getLastPartiallyVisibleColumn()', () => {
    it('should internally call `getLastPartiallyVisibleColumn` method of the Scroll module of the Walkontable', async() => {
      const hot = handsontable({});

      spyOn(tableView()._wt.wtScroll, 'getLastPartiallyVisibleColumn').and.returnValue(1);
      spyOn(hot.columnIndexMapper, 'getVisualFromRenderableIndex').and.returnValue(2);

      expect(tableView().getLastPartiallyVisibleColumn()).toBe(2);
      expect(tableView()._wt.wtScroll.getLastPartiallyVisibleColumn).toHaveBeenCalledTimes(1);
      expect(hot.columnIndexMapper.getVisualFromRenderableIndex).toHaveBeenCalledOnceWith(1);
    });
  });

  describe('getViewportWidth()', () => {
    it('should internally call `getViewportWidth` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getViewportWidth').and.returnValue(100);

      expect(tableView().getViewportWidth()).toBe(100);
      expect(tableView()._wt.wtViewport.getViewportWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkspaceWidth()', () => {
    it('should internally call `getWorkspaceWidth` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getWorkspaceWidth').and.returnValue(100);

      expect(tableView().getWorkspaceWidth()).toBe(100);
      expect(tableView()._wt.wtViewport.getWorkspaceWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getViewportHeight()', () => {
    it('should internally call `getViewportHeight` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getViewportHeight').and.returnValue(100);

      expect(tableView().getViewportHeight()).toBe(100);
      expect(tableView()._wt.wtViewport.getViewportHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkspaceHeight()', () => {
    it('should internally call `getWorkspaceHeight` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getWorkspaceHeight').and.returnValue(100);

      expect(tableView().getWorkspaceHeight()).toBe(100);
      expect(tableView()._wt.wtViewport.getWorkspaceHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasVerticalScroll()', () => {
    it('should internally call `hasVerticalScroll` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'hasVerticalScroll').and.returnValue(100);

      expect(tableView().hasVerticalScroll()).toBe(100);
      expect(tableView()._wt.wtViewport.hasVerticalScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasHorizontalScroll()', () => {
    it('should internally call `hasHorizontalScroll` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'hasHorizontalScroll').and.returnValue(100);

      expect(tableView().hasHorizontalScroll()).toBe(100);
      expect(tableView()._wt.wtViewport.hasHorizontalScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableWidth()', () => {
    it('should internally call `getTableWidth` method of the Table module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtTable, 'getWidth').and.returnValue(100);

      expect(tableView().getTableWidth()).toBe(100);
      expect(tableView()._wt.wtTable.getWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableHeight()', () => {
    it('should internally call `getTableHeight` method of the Table module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtTable, 'getHeight').and.returnValue(100);

      expect(tableView().getTableHeight()).toBe(100);
      expect(tableView()._wt.wtTable.getHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTotalTableWidth()', () => {
    it('should internally call `getTotalTableWidth` method of the Table module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtTable, 'getTotalWidth').and.returnValue(100);

      expect(tableView().getTotalTableWidth()).toBe(100);
      expect(tableView()._wt.wtTable.getTotalWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTotalTableHeight()', () => {
    it('should internally call `getTotalTableHeight` method of the Table module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtTable, 'getTotalHeight').and.returnValue(100);

      expect(tableView().getTotalTableHeight()).toBe(100);
      expect(tableView()._wt.wtTable.getTotalHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRowHeaderWidth()', () => {
    it('should internally call `getRowHeaderWidth` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getRowHeaderWidth').and.returnValue(100);

      expect(tableView().getRowHeaderWidth()).toBe(100);
      expect(tableView()._wt.wtViewport.getRowHeaderWidth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getColumnHeaderHeight()', () => {
    it('should internally call `getColumnHeaderHeight` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getColumnHeaderHeight').and.returnValue(100);

      expect(tableView().getColumnHeaderHeight()).toBe(100);
      expect(tableView()._wt.wtViewport.getColumnHeaderHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('isVerticallyScrollableByWindow()', () => {
    it('should internally call `isVerticallyScrollableByWindow` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'isVerticallyScrollableByWindow').and.returnValue(true);

      expect(tableView().isVerticallyScrollableByWindow()).toBe(true);
      expect(tableView()._wt.wtViewport.isVerticallyScrollableByWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('isHorizontallyScrollableByWindow()', () => {
    it('should internally call `isHorizontallyScrollableByWindow` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'isHorizontallyScrollableByWindow').and.returnValue(true);

      expect(tableView().isHorizontallyScrollableByWindow()).toBe(true);
      expect(tableView()._wt.wtViewport.isHorizontallyScrollableByWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableOffset()', () => {
    it('should internally call `getWorkspaceOffset` method of the Viewport module of the Walkontable', async() => {
      handsontable({});

      spyOn(tableView()._wt.wtViewport, 'getWorkspaceOffset').and.returnValue(true);

      expect(tableView().getTableOffset()).toBe(true);
      expect(tableView()._wt.wtViewport.getWorkspaceOffset).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTableScrollPosition()', () => {
    it('should internally call `getTableScrollPosition` method of the Table module of the Walkontable', async() => {
      handsontable({});

      expect(tableView().getTableScrollPosition()).toEqual({ left: 0, top: 0 });
    });
  });

  describe('setTableScrollPosition()', () => {
    it('should internally call `setTableScrollPosition` method of the Table module of the Walkontable', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        width: 10,
        height: 10,
      });

      tableView().setTableScrollPosition({ left: 10, top: 10 });

      expect(tableView().getTableScrollPosition()).toEqual({ left: 10, top: 10 });
    });
  });

  describe('render()', () => {
    it('should draw a table as fast render when the dataset size is not changed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(true);
    });

    it('should draw a table as slow render when the `forceFullRender` flag is set and the dataset size is not changed', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
      });

      spyOn(tableView()._wt, 'draw').and.callThrough();
      hot.forceFullRender = true;
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
      expect(hot.forceFullRender).toBe(false);
    });

    it('should draw a table as slow render when the dataset size is changed (number of rows is changed)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      spyOn(tableView()._wt, 'draw').and.callThrough();
      await loadData(createSpreadsheetData(10, 5));

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the dataset size is changed (number of columns is changed)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      spyOn(tableView()._wt, 'draw').and.callThrough();
      await loadData(createSpreadsheetData(5, 10));

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the number of visible rows was changed (hiding)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValueAtIndex(2, true);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the number of visible columns was changed (hiding)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValueAtIndex(2, true);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the number of visible rows was changed (trimming)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'trimming')
        .setValueAtIndex(2, true);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the number of visible columns was changed (trimming)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'trimming')
        .setValueAtIndex(2, true);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the rows order changed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper().moveIndexes(0, 2);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when the columns order changed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper().moveIndexes(0, 2);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when index sequence for rows was changed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper().setIndexesSequence([1, 0, 2, 3, 4]);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });

    it('should draw a table as slow render when index sequence for columns was changed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper().setIndexesSequence([1, 0, 2, 3, 4]);

      spyOn(tableView()._wt, 'draw').and.callThrough();
      tableView().render();

      expect(tableView()._wt.draw).toHaveBeenCalledWith(false);
    });
  });
});
