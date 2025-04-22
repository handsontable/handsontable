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

  describe('`isEntireRowSelected` method', () => {
    it('should return `true` when the entire row is selected (headers off)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 1, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 4]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(true);

      selection().selectRows(0);

      expect(selection().isEntireRowSelected()).toBe(true);
    });

    it('should return `true` when the entire row is selected (headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 1, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 4]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectRows(0);

      expect(selection().isEntireRowSelected()).toBe(true);
    });

    it('should return `true` when the entire row is selected (multiple headers, navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
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

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 1, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 4]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectCells([[1, 0, 1, 5]]);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectRows(0);

      expect(selection().isEntireRowSelected()).toBe(true);
    });

    it('should be possible to check the rows selection for each selection layer individually', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      await listen();
      selection().selectColumns(2);
      await keyDown('control/meta');
      selection().selectRows(2);
      await keyDown('control/meta');
      selection().selectColumns(0);
      await keyDown('control/meta');
      selection().selectRows(0);
      await keyUp('control/meta');

      expect(selection().isEntireRowSelected(4)).toBe(false); // out of range
      expect(selection().isEntireRowSelected(3)).toBe(true);
      expect(selection().isEntireRowSelected(2)).toBe(false);
      expect(selection().isEntireRowSelected(1)).toBe(true);
      expect(selection().isEntireRowSelected(0)).toBe(false);
    });

    it('should return `true` when the corner is selected with row headers', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selection().selectAll(false, false);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectAll(false, true);

      expect(selection().isEntireRowSelected()).toBe(false);

      selection().selectAll(true, true);

      expect(selection().isEntireRowSelected()).toBe(true);
    });
  });
});
