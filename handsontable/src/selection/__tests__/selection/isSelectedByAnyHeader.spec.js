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
    it('should return `true` when one of the headers are selected (headers off)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectRows(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectColumns(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(false, false);

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectAll(true, true);

      expect(selection().isSelectedByAnyHeader()).toBe(false);
    });

    it('should return `true` when one of the headers are selected (headers on)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectRows(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectColumns(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(false, false);

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectAll(true, false);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(false, true);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(true, true);

      expect(selection().isSelectedByAnyHeader()).toBe(true);
    });

    it('should return `true` when one of the headers are selected (multiple headers, navigableHeaders on)', async() => {
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

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectRows(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectColumns(0);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(false, false);

      expect(selection().isSelectedByAnyHeader()).toBe(false);

      selection().deselect();
      selection().selectAll(true, false);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(false, true);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(true, true);

      expect(selection().isSelectedByAnyHeader()).toBe(true);

      selection().deselect();
      selection().selectAll(-1, -1);

      expect(selection().isSelectedByAnyHeader()).toBe(true);
    });
  });
});
