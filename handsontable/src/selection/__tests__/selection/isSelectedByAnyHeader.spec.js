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

  describe('`isSelectedByAnyHeader` method', () => {
    it('should return `true` when one of the headers are selected (headers off)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectRows(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectColumns(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(false, false);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectAll(true, true);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);
    });

    it('should return `true` when one of the headers are selected (headers on)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectRows(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectColumns(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(false, false);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectAll(true, false);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(false, true);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(true, true);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);
    });

    it('should return `true` when one of the headers are selected (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
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

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectRows(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectColumns(0);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(false, false);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(false);

      hot.selection.deselect();
      hot.selection.selectAll(true, false);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(false, true);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(true, true);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);

      hot.selection.deselect();
      hot.selection.selectAll(-1, -1);

      expect(hot.selection.isSelectedByAnyHeader()).toBe(true);
    });
  });
});
