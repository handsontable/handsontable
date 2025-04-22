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

  describe('`isSelectedByRowHeader` method', () => {
    it('should return `true` when the selection was performed by the `selectRows` method only (headers off)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectCells([[0, 0, 3, 0]]);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectRows(0);

      expect(selection().isSelectedByRowHeader()).toBe(true);
    });

    it('should return `true` when the selection was performed by the `selectRows` method only (headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectCells([[0, 0, 3, 0]]);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectRows(0);

      expect(selection().isSelectedByRowHeader()).toBe(true);
    });

    it('should return `true` when the selection was performed by the `selectRows` method only (multiple headers, navigableHeaders on)', async() => {
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

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectColumns(1);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectCells([[0, 0, 3, 0]]);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectRows(0);

      expect(selection().isSelectedByRowHeader()).toBe(true);
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

      expect(selection().isSelectedByRowHeader(4)).toBe(false); // out of range
      expect(selection().isSelectedByRowHeader(3)).toBe(true);
      expect(selection().isSelectedByRowHeader(2)).toBe(false);
      expect(selection().isSelectedByRowHeader(1)).toBe(true);
      expect(selection().isSelectedByRowHeader(0)).toBe(false);
    });

    it('should return `false` when the corner is selected with row headers', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selection().selectAll(false, true);

      expect(selection().isSelectedByRowHeader()).toBe(false);

      selection().selectAll(true, false);

      expect(selection().isSelectedByRowHeader()).toBe(true);

      selection().selectAll(true, true);

      expect(selection().isSelectedByRowHeader()).toBe(false);
    });
  });
});
