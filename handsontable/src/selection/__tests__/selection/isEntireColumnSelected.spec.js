describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }
  function rowHeader(renderableRowIndex, TH) {
    const visualRowIndex = renderableRowIndex >= 0 ?
      this.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

    this.view.appendRowHeader(visualRowIndex, TH);
  }

  describe('`isEntireColumnSelected` method', () => {
    it('should return `true` when the entire column is selected (headers off)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectRows(1);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[1, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 4, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(true);

      hot.selection.selectColumns(0);

      expect(hot.selection.isEntireColumnSelected()).toBe(true);
    });

    it('should return `true` when the entire column is selected (headers on)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectRows(1);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[1, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 4, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectColumns(0);

      expect(hot.selection.isEntireColumnSelected()).toBe(true);
    });

    it('should return `true` when the entire column is selected (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectRows(1);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[1, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 4, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectCells([[0, 1, 5, 1]]);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectColumns(0);

      expect(hot.selection.isEntireColumnSelected()).toBe(true);
    });

    it('should be possible to check the columns selection for each selection layer individually', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      listen();
      hot.selection.selectRows(2);
      keyDown('control/meta');
      hot.selection.selectColumns(2);
      keyDown('control/meta');
      hot.selection.selectRows(0);
      keyDown('control/meta');
      hot.selection.selectColumns(0);
      keyUp('control/meta');

      expect(hot.selection.isEntireColumnSelected(4)).toBe(false); // out of range
      expect(hot.selection.isEntireColumnSelected(3)).toBe(true);
      expect(hot.selection.isEntireColumnSelected(2)).toBe(false);
      expect(hot.selection.isEntireColumnSelected(1)).toBe(true);
      expect(hot.selection.isEntireColumnSelected(0)).toBe(false);
    });

    it('should return `true` when the corner is selected with column headers', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      hot.selection.selectAll(false, false);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectAll(true, false);

      expect(hot.selection.isEntireColumnSelected()).toBe(false);

      hot.selection.selectAll(true, true);

      expect(hot.selection.isEntireColumnSelected()).toBe(true);
    });
  });
});
