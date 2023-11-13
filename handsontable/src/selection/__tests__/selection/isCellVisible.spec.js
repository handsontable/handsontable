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

  describe('`isCellVisible` method', () => {
    it('should return `true` when the cell is visible', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      expect(hot.selection.isCellVisible(cellCoords(-2, -2))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(0, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(1, 1))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(5, 3))).toBe(true);
    });

    it('should return `false` for coords that points to the dataset beyond the range', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
      });

      expect(hot.selection.isCellVisible(cellCoords(100, 0))).toBe(false);
      expect(hot.selection.isCellVisible(cellCoords(0, 100))).toBe(false);
      expect(hot.selection.isCellVisible(cellCoords(100, 100))).toBe(false);
    });

    it('should return `false` when row is not visible', () => {
      const hot = handsontable({
        data: createSpreadsheetData(6, 4),
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(5, true);
      render();

      expect(hot.selection.isCellVisible(cellCoords(0, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(1, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(2, 0))).toBe(false);
      expect(hot.selection.isCellVisible(cellCoords(3, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(4, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(5, 0))).toBe(false);
    });

    it('should return `false` when column is not visible', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 6),
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(5, true);
      render();

      expect(hot.selection.isCellVisible(cellCoords(0, 0))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(0, 1))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(0, 2))).toBe(false);
      expect(hot.selection.isCellVisible(cellCoords(0, 3))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(0, 4))).toBe(true);
      expect(hot.selection.isCellVisible(cellCoords(0, 5))).toBe(false);
    });
  });
});
